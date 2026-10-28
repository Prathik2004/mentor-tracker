import { Router, Request, Response } from 'express';
import Deduction from '../models/Deduction';
import { calculateClassMonth } from '../utils/paymentCalculator';
import { getUserId } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = { ownerId: getUserId(req) };
    if (req.query.month) filter.month = req.query.month;
    res.json(await Deduction.find(filter).sort({ date: -1, createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deductions' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, type, amount, notes } = req.body;
    if (!date || !type || amount === undefined || amount === null || Number(amount) < 0) {
      return res.status(400).json({ error: 'Date, type, and a non-negative amount are required' });
    }

    const deduction = new Deduction({
      ownerId: getUserId(req),
      date: new Date(date),
      type: String(type).trim(),
      amount: Number(amount),
      month: calculateClassMonth(new Date(date)),
      notes,
    });
    await deduction.save();
    res.status(201).json(deduction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create deduction' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deduction = await Deduction.findOneAndDelete({ _id: req.params.id, ownerId: getUserId(req) });
    if (!deduction) return res.status(404).json({ error: 'Deduction not found' });
    res.json({ message: 'Deduction deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete deduction' });
  }
});

export default router;
