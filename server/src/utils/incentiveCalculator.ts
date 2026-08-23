import mongoose from 'mongoose';
import Class from '../models/Class';
import Incentive from '../models/Incentive';
import Student from '../models/Student';
import IncentiveType from '../models/IncentiveType';

const DAY_MS = 24 * 60 * 60 * 1000;
const INCENTIVE_TYPES = ['Demo conversion', 'Early class incentive', 'Average class incentive', 'Monthly hours incentive'];
let incentiveTypesReady: Promise<void> | null = null;

function month(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function containsStudentName(notes: string | undefined, name: string): boolean {
  if (!notes || !name.trim()) return false;
  const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i').test(notes);
}

export function hasCompletedClassSequence(
  classes: Array<{ class_no?: number | null; status: string }>,
  milestone: number
): boolean {
  const classesByNumber = new Map(classes.map((classRecord) => [classRecord.class_no, classRecord]));
  return Array.from({ length: milestone }, (_, index) => classesByNumber.get(index + 1))
    .every((classRecord) => classRecord?.status === 'completed');
}

function makeIncentive(ruleKey: string, date: Date, type: string, description: string, amount: number) {
  return {
    updateOne: {
      filter: { ruleKey },
      update: {
        $setOnInsert: { ruleKey, date, type, description, amount, month: month(date) }
      },
      upsert: true,
    }
  };
}

async function ensureIncentiveTypes(): Promise<void> {
  incentiveTypesReady ??= IncentiveType.bulkWrite(INCENTIVE_TYPES.map((name) => ({
    updateOne: { filter: { name }, update: { $setOnInsert: { name, isDefault: true } }, upsert: true }
  })), { ordered: false }).then(() => undefined);
  await incentiveTypesReady;
}

export async function recalculateAllStudentIncentives(): Promise<void> {
  const students = await Student.find().select('_id').lean();
  await Promise.all(students.map((student) => recalculateStudentIncentives(student._id)));
}

/** Rebuilds derived class numbers and idempotent class-based incentives for one student. */
export async function recalculateStudentIncentives(studentId: string | mongoose.Types.ObjectId): Promise<void> {
  await ensureIncentiveTypes();
  const id = new mongoose.Types.ObjectId(String(studentId));
  const student = await Student.findById(id).select('name createdAt').lean();
  if (!student) return;

  const escapedName = student.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const classes = await Class.find({
    deletedAt: null,
    $or: [{ studentId: id }, { classType: 'demo', notes: { $regex: escapedName, $options: 'i' } }]
  }).sort({ date: 1, createdAt: 1 }).select('date status classType notes class_no studentId').lean();
  const studentClasses = classes.filter((classRecord) => String(classRecord.studentId) === String(id));
  const conversionDemos = classes.filter((classRecord) =>
    classRecord.classType === 'demo' && containsStudentName(classRecord.notes, student.name)
  );

  const assignedClassNumbers = new Set(
    studentClasses
      .map((classRecord) => classRecord.class_no)
      .filter((classNo): classNo is number => typeof classNo === 'number' && classNo > 0)
  );
  let nextClassNumber = Math.max(0, ...assignedClassNumbers) + 1;
  const classNumbers = studentClasses.map((classRecord) => {
    let class_no = classRecord.class_no;
    if (classRecord.status !== 'completed') {
      class_no = null;
    } else if (typeof class_no !== 'number' || class_no < 1) {
      while (assignedClassNumbers.has(nextClassNumber)) nextClassNumber += 1;
      class_no = nextClassNumber;
      assignedClassNumbers.add(class_no);
      nextClassNumber += 1;
    }
    classRecord.class_no = class_no;
    return { id: classRecord._id, class_no };
  });
  await Class.bulkWrite(classNumbers.map(({ id: classId, class_no }) => ({
    updateOne: { filter: { _id: classId }, update: { $set: { class_no } } }
  })));

  const completed = studentClasses.filter((classRecord) => classRecord.status === 'completed');
  const operations = [];

  // A conversion is identified by the student's name in a demo note and is paid at class 8.
  conversionDemos.forEach((demo, index) => {
    const conversionNumber = index + 1;
    if (conversionNumber > 6) return;
    const qualifyingClass = completed.find((classRecord) =>
      classRecord.date >= demo.date && (classRecord.class_no ?? 0) >= 8
    );
    if (qualifyingClass) {
      const amount = conversionNumber <= 3 ? 500 : 750;
      operations.push(makeIncentive(
        `demo-conversion:${id}:${demo._id}`,
        qualifyingClass.date,
        'Demo conversion',
        `Conversion ${conversionNumber} for ${student.name}`,
        amount
      ));
    }
  });

  for (const milestone of [4, 8]) {
    const qualifyingClass = completed.find((classRecord) => classRecord.class_no === milestone);
    if (qualifyingClass && hasCompletedClassSequence(studentClasses, milestone)) {
      operations.push(makeIncentive(
        `early-class:${id}:${milestone}`,
        qualifyingClass.date,
        'Early class incentive',
        `${milestone} classes completed without cancellation for ${student.name}`,
        milestone === 4 ? 400 : 800
      ));
    }
  }

  const firstClass = completed[0];
  if (firstClass) {
    const within30Days = completed.filter((classRecord) =>
      classRecord.date.getTime() - firstClass.date.getTime() <= 30 * DAY_MS
    );
    for (const milestone of [8, 10]) {
      if (within30Days.length >= milestone) {
        operations.push(makeIncentive(
          `average-class:${id}:${milestone}`,
          within30Days[milestone - 1].date,
          'Average class incentive',
          `${milestone} classes within 30 days for ${student.name}`,
          milestone === 8 ? 200 : 300
        ));
      }
    }

  }

  const monthlyCompleted = new Map<string, typeof completed>();
  completed.forEach((classRecord) => {
    const classMonth = month(classRecord.date);
    const monthClasses = monthlyCompleted.get(classMonth) || [];
    monthClasses.push(classRecord);
    monthlyCompleted.set(classMonth, monthClasses);
  });
  const joiningDate = new Date(student.createdAt);
  monthlyCompleted.forEach((monthClasses, classMonth) => {
    const tenureMonths = (new Date(`${classMonth}-01`).getTime() - joiningDate.getTime()) / (DAY_MS * 30);
    const threshold = tenureMonths < 3 ? 80 : 100;
    if (monthClasses.length >= threshold) {
      operations.push(makeIncentive(
        `monthly-hours:${id}:${classMonth}`,
        monthClasses[threshold - 1].date,
        'Monthly hours incentive',
        `${threshold} completed classes in ${classMonth} for ${student.name}`,
        tenureMonths < 3 ? 750 : 1500
      ));
    }
  });

  const rulePrefixes = [`demo-conversion:${id}:`, `early-class:${id}:`, `average-class:${id}:`, `monthly-hours:${id}:`];
  const desiredRuleKeys = operations.map((operation) => operation.updateOne.filter.ruleKey);
  await Incentive.deleteMany({
    $or: rulePrefixes.map((prefix) => ({ ruleKey: { $regex: `^${prefix}` } })),
    ...(desiredRuleKeys.length ? { ruleKey: { $nin: desiredRuleKeys } } : {}),
  });
  if (operations.length) await Incentive.bulkWrite(operations, { ordered: false });
}