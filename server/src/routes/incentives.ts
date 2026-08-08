import { Router, Request, Response } from 'express';
import Incentive from '../models/Incentive';
import { calculateClassMonth } from '../utils/paymentCalculator';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    const filter: any = {};
    if (month) {
      filter.month = month;
    }
    const incentives = await Incentive.find(filter).sort({ date: -1 });
    res.json(incentives);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incentives' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const incentive = await Incentive.findById(req.params.id);
    if (!incentive) return res.status(404).json({ error: 'Incentive not found' });
    res.json(incentive);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incentive' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, type, description, amount, notes } = req.body;

    if (!date || !type || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Date, type, and amount are required' });
    }

    const incentiveDate = new Date(date);
    const month = calculateClassMonth(incentiveDate);

    const incentive = new Incentive({
      date: incentiveDate,
      type: type.trim(),
      description,
      amount,
      month,
      notes,
    });

    await incentive.save();
    res.status(201).json(incentive);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create incentive' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updates: any = { ...req.body };

    // Recalculate month if date changed
    if (updates.date) {
      const incentiveDate = new Date(updates.date);
      updates.month = calculateClassMonth(incentiveDate);
    }

    const incentive = await Incentive.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!incentive) return res.status(404).json({ error: 'Incentive not found' });
    res.json(incentive);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incentive' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const incentive = await Incentive.findByIdAndDelete(req.params.id);
    if (!incentive) return res.status(404).json({ error: 'Incentive not found' });
    res.json({ message: 'Incentive deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete incentive' });
  }
});

export default router;
