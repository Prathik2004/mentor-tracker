import PaymentRule from '../models/PaymentRule';
import Settings from '../models/Settings';

export async function getPaymentCycleSettings() {
  const windowStart = await Settings.findOne({ key: 'payment_window_start' });
  const windowEnd = await Settings.findOne({ key: 'payment_window_end' });
  return {
    windowStart: windowStart?.value ?? 10,
    windowEnd: windowEnd?.value ?? 15
  };
}

export function calculateClassMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function calculatePaymentMonth(classMonth: string): string {
  const [year, month] = classMonth.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function calculatePaymentWindow(paymentMonth: string, windowStart: number, windowEnd: number) {
  const [year, month] = paymentMonth.split('-').map(Number);
  return {
    start: new Date(year, month - 1, windowStart),
    end: new Date(year, month - 1, windowEnd)
  };
}

export async function getApplicablePaymentRule(
  classType: string,
  status: string,
  classDate: Date
) {
  const paymentStatus = status === 'completed' ? 'completed' : 'student_no_show';

  const filter: any = {
    classType,
    status: paymentStatus,
    effectiveFrom: { $lte: classDate },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: classDate } }
    ]
  };

  const rule = await PaymentRule.findOne(filter).sort({ effectiveFrom: -1 });

  return rule;
}

export async function calculateClassPayment(
  classType: string,
  status: string,
  classDate: Date
) {
  if (status === 'cancelled' || status === 'rescheduled') {
    return { amount: 0, rule: null, regularAmount: 0, ptmAmount: 0 };
  }

  // PTM means "Regular class + PTM" — combine both payment rules.
  if (classType === 'ptm') {
    const [regularRule, ptmRule] = await Promise.all([
      getApplicablePaymentRule('regular', status, classDate),
      getApplicablePaymentRule('ptm', status, classDate),
    ]);

    const regularAmount = regularRule?.amount ?? 0;
    const ptmAmount = ptmRule?.amount ?? 0;
    const totalAmount = regularAmount + ptmAmount;

    return {
      amount: totalAmount,
      rule: ptmRule ? {
        classType: 'ptm',
        status: ptmRule.status,
        amount: totalAmount,
        ruleId: ptmRule._id.toString()
      } : null,
      regularAmount,
      ptmAmount,
    };
  }

  const rule = await getApplicablePaymentRule(classType, status, classDate);

  if (!rule) {
    return { amount: 0, rule: null, regularAmount: 0, ptmAmount: 0 };
  }

  return {
    amount: rule.amount,
    rule: {
      classType: rule.classType,
      status: rule.status,
      amount: rule.amount,
      ruleId: rule._id.toString()
    },
    regularAmount: 0,
    ptmAmount: 0,
  };
}

export async function buildClassRecord(
  date: Date,
  classType: string,
  status: string
) {
  const { amount, rule } = await calculateClassPayment(classType, status, date);
  const classMonth = calculateClassMonth(date);
  const paymentMonth = calculatePaymentMonth(classMonth);
  const cycleSettings = await getPaymentCycleSettings();
  const window = calculatePaymentWindow(paymentMonth, cycleSettings.windowStart, cycleSettings.windowEnd);

  return {
    paymentAmount: amount,
    paymentRuleSnapshot: rule,
    classMonth,
    paymentMonth,
    paymentWindowStart: window.start,
    paymentWindowEnd: window.end
  };
}
