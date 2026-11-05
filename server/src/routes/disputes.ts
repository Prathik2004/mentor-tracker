import { Router, Request, Response } from 'express';
import Class from '../models/Class';
import { getUserId } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = { ownerId: getUserId(req), deletedAt: null, 'dispute.raised': true };
    if (req.query.month) filter.classMonth = String(req.query.month);
    if (req.query.status) filter['dispute.status'] = String(req.query.status);
    const disputes = await Class.find(filter)
      .populate('studentId', 'name course')
      .sort({ date: -1, createdAt: -1 })
      .lean();
    res.json(disputes);
  } catch {
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

router.put('/:classId/resolve', async (req: Request, res: Response) => {
  try {
    const { paymentReversed, reversedAmount, resolutionNotes } = req.body;
    const amount = Number(reversedAmount ?? 0);
    if (typeof paymentReversed !== 'boolean' || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: 'Payment reversal status and a valid amount are required' });
    }
    const classRecord = await Class.findOne({ _id: req.params.classId, ownerId: getUserId(req), deletedAt: null });
    if (!classRecord?.dispute?.raised) return res.status(404).json({ error: 'Dispute not found' });
    if (amount > classRecord.dispute.deductedAmount) {
      return res.status(400).json({ error: 'Reversed amount cannot exceed the deducted amount' });
    }
    const gross = classRecord.originalPaymentAmount || classRecord.paymentAmount + classRecord.dispute.deductedAmount;
    const previousPaymentAmount = classRecord.paymentAmount;
    classRecord.dispute.status = 'resolved';
    classRecord.dispute.paymentReversed = paymentReversed;
    classRecord.dispute.reversedAmount = paymentReversed ? amount : 0;
    classRecord.dispute.resolvedAt = new Date();
    classRecord.dispute.resolutionNotes = resolutionNotes?.trim() || undefined;
    classRecord.paymentAmount = Math.max(0, Math.min(gross, gross - classRecord.dispute.deductedAmount + classRecord.dispute.reversedAmount));
    classRecord.regularPaymentAmount = Math.max(0, classRecord.regularPaymentAmount + classRecord.paymentAmount - previousPaymentAmount);
    await classRecord.save();
    res.json(await classRecord.populate('studentId', 'name course'));
  } catch {
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

export default router;
