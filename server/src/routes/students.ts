import { Router, Request, Response } from 'express';
import Student from '../models/Student';
import Class from '../models/Class';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const filter: any = {};
    if (search) {
      filter.name = { $regex: search as string, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }
    const students = await Student.find(filter).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, age, course, status, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Student name is required' });
    }
    const student = new Student({ name: name.trim(), age, course, status, notes });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create student' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const classCount = await Class.countDocuments({ studentId: req.params.id, deletedAt: null });
    if (classCount > 0) {
      return res.status(400).json({ error: `Cannot delete student with ${classCount} associated classes` });
    }
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;
