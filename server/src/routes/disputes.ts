import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Class from '../models/Class';
import Dispute from '../models/Dispute';
import { getUserId } from '../middleware/auth';

const router = Router();

async function backfillEmbeddedDisputes(ownerId: string) {
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
  const legacyClasses = await Class.find({
    ownerId: ownerObjectId,
    deletedAt: null,
    'dispute.raised': true,
  }).select('_id dispute').lean();

  if (legacyClasses.length > 0) {
    await Dispute.bulkWrite(legacyClasses.map((classRecord) => ({
      updateOne: {
        filter: { ownerId: ownerObjectId, classId: classRecord._id },
        update: {
          $setOnInsert: {
            ownerId: ownerObjectId,
            classId: classRecord._id,
            reason: classRecord.dispute?.reason || 'Legacy class dispute',
            deductedAmount: classRecord.dispute?.deductedAmount || 0,
            status: classRecord.dispute?.status || 'open',
            paymentReversed: classRecord.dispute?.paymentReversed || false,
            reversedAmount: classRecord.dispute?.reversedAmount || 0,
            resolvedAt: classRecord.dispute?.resolvedAt || null,
            resolutionNotes: classRecord.dispute?.resolutionNotes,
          },
        },
        upsert: true,
      },
    })));
  }
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const ownerId = getUserId(req);
    await backfillEmbeddedDisputes(ownerId);
    const filter: any = { ownerId };
    if (req.query.status) filter.status = String(req.query.status);

    const disputes = await Dispute.find(filter)
      .populate({
        path: 'classId',
        match: {
          deletedAt: null,
          ...(req.query.month ? { classMonth: String(req.query.month) } : {}),
        },
        populate: { path: 'studentId', select: 'name course' },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(disputes
      .filter((dispute) => dispute.classId)
      .map((dispute: any) => ({
        ...dispute.classId,
        dispute: {
          raised: true,
          reason: dispute.reason,
          deductedAmount: dispute.deductedAmount,
          status: dispute.status,
          paymentReversed: dispute.paymentReversed,
          reversedAmount: dispute.reversedAmount,
          resolvedAt: dispute.resolvedAt,
          resolutionNotes: dispute.resolutionNotes,
        },
      })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

router.put('/:classId/resolve', async (req: Request, res: Response) => {
  try {
    const ownerId = getUserId(req);
    const { paymentReversed, reversedAmount, resolutionNotes } = req.body;
    const amount = Number(reversedAmount ?? 0);
    if (typeof paymentReversed !== 'boolean' || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: 'Payment reversal status and a valid amount are required' });
    }

    const dispute = await Dispute.findOne({ classId: req.params.classId, ownerId });
    const classRecord = await Class.findOne({ _id: req.params.classId, ownerId, deletedAt: null });
    if (!dispute || !classRecord) return res.status(404).json({ error: 'Dispute not found' });
    if (amount > dispute.deductedAmount) {
      return res.status(400).json({ error: 'Reversed amount cannot exceed the deducted amount' });
    }

    const gross = classRecord.originalPaymentAmount || classRecord.paymentAmount + dispute.deductedAmount;
    const previousPaymentAmount = classRecord.paymentAmount;
    dispute.status = 'resolved';
    dispute.paymentReversed = paymentReversed;
    dispute.reversedAmount = paymentReversed ? amount : 0;
    dispute.resolvedAt = new Date();
    dispute.resolutionNotes = resolutionNotes?.trim() || undefined;
    classRecord.dispute = {
      raised: true,
      reason: dispute.reason,
      deductedAmount: dispute.deductedAmount,
      status: dispute.status,
      paymentReversed: dispute.paymentReversed,
      reversedAmount: dispute.reversedAmount,
      resolvedAt: dispute.resolvedAt,
      resolutionNotes: dispute.resolutionNotes,
    };
    classRecord.paymentAmount = Math.max(0, Math.min(gross, gross - dispute.deductedAmount + dispute.reversedAmount));
    classRecord.regularPaymentAmount = Math.max(0, classRecord.regularPaymentAmount + classRecord.paymentAmount - previousPaymentAmount);
    await Promise.all([dispute.save(), classRecord.save()]);
    res.json(await classRecord.populate('studentId', 'name course'));
  } catch {
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

export default router;
