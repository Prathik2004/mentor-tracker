import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Class from '../models/Class';
import Incentive from '../models/Incentive';
import { calculatePaymentMonth, calculatePaymentWindow, getPaymentCycleSettings } from '../utils/paymentCalculator';
import { getUserId } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const ownerId = getUserId(req);
    const payments = await Payment.find({ ownerId }).sort({ earningMonth: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.get('/:month', async (req: Request, res: Response) => {
  try {
    const month = String(req.params.month);
    const ownerId = getUserId(req);
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    let payment = await Payment.findOne({ earningMonth: month, ownerId });

    if (!payment) {
      // Auto-create a payment record if it doesn't exist
      const cycleSettings = await getPaymentCycleSettings(ownerId);
      const paymentMonth = calculatePaymentMonth(month);
      const window = calculatePaymentWindow(paymentMonth, cycleSettings.windowStart, cycleSettings.windowEnd);

      // Calculate expected amount
      const [classEarnings, incentiveEarnings] = await Promise.all([
        Class.aggregate([
          { $match: { classMonth: month, deletedAt: null, ownerId: ownerObjectId } },
          { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
        ]),
        Incentive.aggregate([
          { $match: { month, ownerId: ownerObjectId } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const classTotal = classEarnings[0]?.total ?? 0;
      const incentiveTotal = incentiveEarnings[0]?.total ?? 0;

      payment = await Payment.create({
        earningMonth: month,
        ownerId,
        expectedAmount: classTotal + incentiveTotal,
        expectedWindowStart: window.start,
        expectedWindowEnd: window.end,
      });
    } else {
      const [classEarnings, incentiveEarnings] = await Promise.all([
        Class.aggregate([
          { $match: { classMonth: month, deletedAt: null, ownerId: ownerObjectId } },
          { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
        ]),
        Incentive.aggregate([
          { $match: { month, ownerId: ownerObjectId } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);
      payment.expectedAmount = (classEarnings[0]?.total ?? 0) + (incentiveEarnings[0]?.total ?? 0);
      await payment.save();
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.put('/:month', async (req: Request, res: Response) => {
  try {
    const month = String(req.params.month);
    const updates = req.body;
    const ownerId = getUserId(req);

    let payment = await Payment.findOne({ earningMonth: month, ownerId });

    if (!payment) {
      // Create the payment record if it doesn't exist
      const cycleSettings = await getPaymentCycleSettings(ownerId);
      const paymentMonth = calculatePaymentMonth(month);
      const window = calculatePaymentWindow(paymentMonth, cycleSettings.windowStart, cycleSettings.windowEnd);

      payment = new Payment({
        earningMonth: month,
        ownerId,
        expectedAmount: 0,
        expectedWindowStart: window.start,
        expectedWindowEnd: window.end,
        ...updates,
      });
      await payment.save();
    } else {
      Object.assign(payment, updates);
      await payment.save();
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

router.post('/recalculate/:month', async (req: Request, res: Response) => {
  try {
    const month = String(req.params.month);
    const ownerId = getUserId(req);
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const [classEarnings, incentiveEarnings] = await Promise.all([
      Class.aggregate([
        { $match: { classMonth: month, deletedAt: null, ownerId: ownerObjectId } },
        { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
      ]),
      Incentive.aggregate([
        { $match: { month, ownerId: ownerObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const classTotal = classEarnings[0]?.total ?? 0;
    const incentiveTotal = incentiveEarnings[0]?.total ?? 0;
    const expectedAmount = classTotal + incentiveTotal;

    const cycleSettings = await getPaymentCycleSettings(ownerId);
    const paymentMonth = calculatePaymentMonth(month);
    const window = calculatePaymentWindow(paymentMonth, cycleSettings.windowStart, cycleSettings.windowEnd);

    const payment = await Payment.findOneAndUpdate(
      { earningMonth: month, ownerId },
      {
        $set: {
          expectedAmount,
          expectedWindowStart: window.start,
          expectedWindowEnd: window.end,
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      payment,
      breakdown: {
        classEarnings: classTotal,
        incentiveEarnings: incentiveTotal,
        total: expectedAmount,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to recalculate payment' });
  }
});

export default router;
