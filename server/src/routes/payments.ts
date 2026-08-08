import { Router, Request, Response } from 'express';
import Payment from '../models/Payment';
import Class from '../models/Class';
import Incentive from '../models/Incentive';
import { calculatePaymentMonth, calculatePaymentWindow, getPaymentCycleSettings } from '../utils/paymentCalculator';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const payments = await Payment.find().sort({ earningMonth: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.get('/:month', async (req: Request, res: Response) => {
  try {
    const month = String(req.params.month);
    let payment = await Payment.findOne({ earningMonth: month });

    if (!payment) {
      // Auto-create a payment record if it doesn't exist
      const cycleSettings = await getPaymentCycleSettings();
      const paymentMonth = calculatePaymentMonth(month);
      const window = calculatePaymentWindow(paymentMonth, cycleSettings.windowStart, cycleSettings.windowEnd);

      // Calculate expected amount
      const [classEarnings, incentiveEarnings] = await Promise.all([
        Class.aggregate([
          { $match: { classMonth: month, deletedAt: null } },
          { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
        ]),
        Incentive.aggregate([
          { $match: { month } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const classTotal = classEarnings[0]?.total ?? 0;
      const incentiveTotal = incentiveEarnings[0]?.total ?? 0;

      payment = await Payment.create({
        earningMonth: month,
        expectedAmount: classTotal + incentiveTotal,
        expectedWindowStart: window.start,
        expectedWindowEnd: window.end,
      });
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

    let payment = await Payment.findOne({ earningMonth: month });

    if (!payment) {
      // Create the payment record if it doesn't exist
      const cycleSettings = await getPaymentCycleSettings();
      const paymentMonth = calculatePaymentMonth(month);
      const window = calculatePaymentWindow(paymentMonth, cycleSettings.windowStart, cycleSettings.windowEnd);

      payment = new Payment({
        earningMonth: month,
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

    const [classEarnings, incentiveEarnings] = await Promise.all([
      Class.aggregate([
        { $match: { classMonth: month, deletedAt: null } },
        { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
      ]),
      Incentive.aggregate([
        { $match: { month } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const classTotal = classEarnings[0]?.total ?? 0;
    const incentiveTotal = incentiveEarnings[0]?.total ?? 0;
    const expectedAmount = classTotal + incentiveTotal;

    const cycleSettings = await getPaymentCycleSettings();
    const paymentMonth = calculatePaymentMonth(month);
    const window = calculatePaymentWindow(paymentMonth, cycleSettings.windowStart, cycleSettings.windowEnd);

    const payment = await Payment.findOneAndUpdate(
      { earningMonth: month },
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
