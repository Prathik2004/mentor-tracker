import { Router, Request, Response } from 'express';
import Class from '../models/Class';
import Student from '../models/Student';
import { buildClassRecord } from '../utils/paymentCalculator';

const router = Router();

async function getNextClassNumber(studentId: string, excludeId?: string) {
  const filter: any = { studentId, deletedAt: null, class_no: { $ne: null } };
  if (excludeId) filter._id = { $ne: excludeId };
  const latest = await Class.findOne(filter).sort({ class_no: -1 }).select('class_no').lean();
  const highestClassNo = latest?.class_no ?? 0;
  const existingNumbers = await Class.find({ ...filter, class_no: { $lte: highestClassNo } })
    .select('class_no')
    .lean();
  const existingNumberSet = new Set(existingNumbers.map((classRecord) => classRecord.class_no));
  const missingClassNumbers = Array.from({ length: highestClassNo }, (_, index) => index + 1)
    .filter((classNo) => !existingNumberSet.has(classNo));
  return { nextClassNo: highestClassNo + 1, highestClassNo, missingClassNumbers };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { month, classType, status, schedulingType, studentId, search, startDate, endDate, page = '1', limit = '50' } = req.query;
    const filter: any = { deletedAt: null };

    if (month) filter.classMonth = month;
    if (classType) filter.classType = classType;
    if (status) filter.status = status;
    if (schedulingType) filter.schedulingType = schedulingType;
    if (studentId) filter.studentId = studentId;
    if (search && typeof search === 'string' && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      const matchingStudents = await Student.find({
        $or: [{ name: searchRegex }, { course: searchRegex }]
      }).select('_id').lean();

      filter.$or = [
        { studentId: { $in: matchingStudents.map((student) => student._id) } },
        { classType: searchRegex },
        { status: searchRegex },
        { schedulingType: searchRegex },
        { notes: searchRegex }
      ];
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate('studentId', 'name course')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Class.countDocuments(filter)
    ]);

    res.json({ classes, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

router.get('/student/:studentId/next-number', async (req: Request, res: Response) => {
  try {
    const result = await getNextClassNumber(String(req.params.studentId));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to determine next class number' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const classRecord = await Class.findById(req.params.id).populate('studentId', 'name course');
    if (!classRecord) return res.status(404).json({ error: 'Class not found' });
    res.json(classRecord);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, time, studentId, classType, status, schedulingType, notes, confirmDuplicate } = req.body;

    if (!date || !classType || !status || !schedulingType) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // A student is required for all class types except demo and substitute
    if (classType !== 'demo' && classType !== 'substitute' && !studentId) {
      return res.status(400).json({ error: 'studentId is required for non-demo, non-substitute classes' });
    }

    const classDate = new Date(date);

    // Duplicate check (demo/substitute classes without a student are matched by type/status/date)
    if (!confirmDuplicate) {
      const startOfDay = new Date(classDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(classDate);
      endOfDay.setHours(23, 59, 59, 999);

      const dupFilter: any = {
        classType,
        status,
        deletedAt: null,
        date: { $gte: startOfDay, $lte: endOfDay }
      };
      if (studentId) dupFilter.studentId = studentId;

      const duplicate = await Class.findOne(dupFilter);

      if (duplicate) {
        return res.status(409).json({
          warning: 'duplicate',
          message: 'A similar class already exists for this student on this date.',
          existingClass: duplicate
        });
      }
    }

    const calculated = await buildClassRecord(classDate, classType, status);
    const classNumber = studentId && status === 'completed'
      ? (await getNextClassNumber(studentId)).nextClassNo
      : null;
    if (classNumber !== null) {
      const duplicateClassNumber = await Class.exists({
        studentId,
        class_no: classNumber,
        deletedAt: null,
      });
      if (duplicateClassNumber) {
        return res.status(409).json({
          warning: 'duplicate-class-number',
          message: `Class number ${classNumber} already exists for this student. Please try again.`,
        });
      }
    }

    const classRecord = new Class({
      date: classDate,
      time: time || null,
      studentId,
      classType,
      status,
      schedulingType,
      notes,
      class_no: classNumber,
      ...calculated
    });

    await classRecord.save();
    const populated = await classRecord.populate('studentId', 'name course');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create class' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { date, classType, status, studentId } = req.body;
    const updates: any = { ...req.body };
    delete updates.class_no;

    // Normalize an emptied time field to null so it can be cleared on edit.
    if (updates.time !== undefined) updates.time = updates.time || null;

    const existing = await Class.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Class not found' });

    // A student is required for all class types except demo and substitute.
    // Evaluated against the effective (new or existing) class type.
    const effectiveClassType = classType || existing.classType;
    if (effectiveClassType !== 'demo' && effectiveClassType !== 'substitute' && studentId == null) {
      return res.status(400).json({ error: 'studentId is required for non-demo, non-substitute classes' });
    }

    if (date || classType || status) {
      const classDate = date ? new Date(date) : existing.date;
      const cType = effectiveClassType;
      const cStatus = status || existing.status;

      const calculated = await buildClassRecord(classDate, cType, cStatus);
      Object.assign(updates, calculated);
    }

    if (studentId !== undefined && String(studentId || '') !== String(existing.studentId || '')) {
      updates.class_no = null;
    }

    const classRecord = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('studentId', 'name course');

    if (!classRecord) return res.status(404).json({ error: 'Class not found' });
    res.json(classRecord);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update class' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const classRecord = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!classRecord) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Class deleted', class: classRecord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    const classRecord = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: { deletedAt: null } },
      { new: true }
    ).populate('studentId', 'name course');
    if (!classRecord) return res.status(404).json({ error: 'Class not found' });
    res.json(classRecord);
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore class' });
  }
});

export default router;
