import { Router, Request, Response } from 'express';
import PaymentRule from '../models/PaymentRule';
import Class from '../models/Class';
import { getApplicablePaymentRule } from '../utils/paymentCalculator';

const router = Router();

// Get all current (active) payment rules
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rules = await PaymentRule.find({ effectiveTo: null }).sort({ classType: 1, status: 1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment rules' });
  }
});

// Update a rule (retire old, create new for history preservation)
router.put('/', async (req: Request, res: Response) => {
  try {
    const { classType, status, amount } = req.body;

    if (!classType || !status || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'classType, status, and amount are required' });
    }

    if (amount < 0) {
      return res.status(400).json({ error: 'Amount must be non-negative' });
    }

    const now = new Date();

    // Find current active rule and retire it
    const currentRule = await PaymentRule.findOne({
      classType,
      status,
      effectiveTo: null,
    });

    if (currentRule) {
      currentRule.effectiveTo = now;
      await currentRule.save();
    }

    /*
     * A brand-new rule (no rule existed for this combo) is an initial setup, not a rate change
     * — it should apply to all existing classes too. Backdate its effectiveFrom to the earliest
     * class date so classes created earlier today (or before) still match.
     * When a rule is being replaced (currentRule exists), the new rate applies from now onward,
     * preserving the historical rate for older classes.
     */
    let effectiveFrom = now;
    if (!currentRule) {
      const earliest = await Class.findOne({ deletedAt: null }).sort({ date: 1 }).select('date');
      effectiveFrom = earliest?.date ?? new Date(0);
    }

    // Create new rule
    const newRule = await PaymentRule.create({
      classType,
      status,
      amount,
      effectiveFrom,
      effectiveTo: null,
    });

    res.json({
      message: 'Payment rule updated',
      previousRule: currentRule,
      newRule,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment rule' });
  }
});

// Calculate payment for given class parameters (preview for Add Class form)
router.get('/calculate', async (req: Request, res: Response) => {
  try {
    const { classType, status, date } = req.query;

    if (!classType || !status) {
      return res.status(400).json({ error: 'classType and status are required' });
    }

    const classDate = date ? new Date(date as string) : new Date();

    if (status === 'cancelled' || status === 'rescheduled') {
      return res.json({ amount: 0, rule: null });
    }

    const rule = await getApplicablePaymentRule(
      classType as string,
      status as string,
      classDate
    );

    if (!rule) {
      return res.json({ amount: 0, rule: null, message: 'No applicable payment rule found' });
    }

    res.json({
      amount: rule.amount,
      rule: {
        classType: rule.classType,
        status: rule.status,
        amount: rule.amount,
        ruleId: rule._id.toString(),
        effectiveFrom: rule.effectiveFrom,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate payment' });
  }
});

// Get rule history for a specific class type and status
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { classType, status } = req.query;
    const filter: any = {};
    if (classType) filter.classType = classType;
    if (status) filter.status = status;

    const rules = await PaymentRule.find(filter).sort({ effectiveFrom: -1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment rule history' });
  }
});

export default router;
