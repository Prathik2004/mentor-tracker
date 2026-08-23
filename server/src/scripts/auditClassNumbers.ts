import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Class from '../models/Class';
import Student from '../models/Student';

dotenv.config();

async function auditClassNumbers(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentor-tracker');

  const students = await Student.find().select('_id name').lean();
  const report = [];

  for (const student of students) {
    const classes = await Class.find({ studentId: student._id, deletedAt: null })
      .select('class_no status')
      .sort({ class_no: 1 })
      .lean();
    const numberedClasses = classes.filter((classRecord) => typeof classRecord.class_no === 'number');
    const counts = new Map<number, number>();
    numberedClasses.forEach((classRecord) => {
      counts.set(classRecord.class_no!, (counts.get(classRecord.class_no!) ?? 0) + 1);
    });
    const highestClassNo = Math.max(0, ...counts.keys());
    const missingClassNumbers = Array.from({ length: highestClassNo }, (_, index) => index + 1)
      .filter((classNo) => !counts.has(classNo));
    const duplicateClassNumbers = [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([classNo]) => classNo);

    if (missingClassNumbers.length || duplicateClassNumbers.length) {
      report.push({
        studentId: student._id,
        studentName: student.name,
        missingClassNumbers,
        duplicateClassNumbers,
      });
    }
  }

  console.log(JSON.stringify({ studentsWithIssues: report.length, students: report }, null, 2));
  await mongoose.disconnect();
}

auditClassNumbers().catch(async (error) => {
  console.error('Class number audit failed:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});