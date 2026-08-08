import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the mongoose models used by the payment calculator
vi.mock('../models/PaymentRule', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('../models/Settings', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import PaymentRule from '../models/PaymentRule';
import Settings from '../models/Settings';
import {
  calculateClassMonth,
  calculatePaymentMonth,
  calculatePaymentWindow,
  getApplicablePaymentRule,
  calculateClassPayment,
  buildClassRecord,
} from './paymentCalculator';

const mockedFindOne = PaymentRule.findOne as ReturnType<typeof vi.fn>;
const mockedSettingsFindOne = Settings.findOne as ReturnType<typeof vi.fn>;

function mockRule(overrides: Partial<any> = {}) {
  return {
    _id: { toString: () => 'rule-1' },
    classType: 'regular',
    status: 'completed',
    amount: 300,
    ...overrides,
  };
}

function mockRuleChain(rule: any) {
  const chain = { sort: vi.fn().mockResolvedValue(rule) };
  mockedFindOne.mockReturnValue(chain);
}

function mockSettings(windowStart: number, windowEnd: number) {
  mockedSettingsFindOne
    .mockImplementation(async ({ key }: any) => ({
      key,
      value: key === 'payment_window_start' ? windowStart : windowEnd,
    }));
}

describe('calculateClassMonth', () => {
  it('extracts the month from a class date', () => {
    expect(calculateClassMonth(new Date(2026, 7, 8))).toBe('2026-08');
    expect(calculateClassMonth(new Date(2026, 0, 1))).toBe('2026-01');
    expect(calculateClassMonth(new Date(2026, 11, 31))).toBe('2026-12');
  });

  it('handles different years', () => {
    expect(calculateClassMonth(new Date(2027, 0, 15))).toBe('2027-01');
  });
});

describe('calculatePaymentMonth', () => {
  it('maps August to September', () => {
    expect(calculatePaymentMonth('2026-08')).toBe('2026-09');
  });

  it('maps January to February', () => {
    expect(calculatePaymentMonth('2026-01')).toBe('2026-02');
  });

  it('handles the December to January year rollover (no month 13)', () => {
    expect(calculatePaymentMonth('2026-12')).toBe('2027-01');
  });

  it('handles the rollover in a different year', () => {
    expect(calculatePaymentMonth('2029-12')).toBe('2030-01');
  });
});

describe('calculatePaymentWindow', () => {
  it('returns the 10th-15th for the payment month', () => {
    const { start, end } = calculatePaymentWindow('2026-09', 10, 15);
    expect(start).toEqual(new Date(2026, 8, 10));
    expect(end).toEqual(new Date(2026, 8, 15));
  });

  it('handles January payment month across years', () => {
    const { start, end } = calculatePaymentWindow('2027-01', 10, 15);
    expect(start).toEqual(new Date(2027, 0, 10));
    expect(end).toEqual(new Date(2027, 0, 15));
  });
});

describe('getApplicablePaymentRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings(10, 15);
  });

  it('finds the active rule for a class date', async () => {
    const rule = mockRule();
    mockRuleChain(rule);
    const result = await getApplicablePaymentRule('regular', 'completed', new Date(2026, 7, 8));
    expect(result).toBe(rule);
  });

  it('maps a no-show class to the no-show rule', async () => {
    const rule = mockRule({ status: 'student_no_show', amount: 50 });
    mockRuleChain(rule);
    await getApplicablePaymentRule('regular', 'student_no_show', new Date(2026, 7, 8));
    expect(mockedFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ classType: 'regular', status: 'student_no_show' })
    );
  });
});

describe('calculateClassPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings(10, 15);
  });

  it('returns 0 for cancelled classes', async () => {
    const { amount, rule } = await calculateClassPayment('regular', 'cancelled', new Date(2026, 7, 8));
    expect(amount).toBe(0);
    expect(rule).toBeNull();
  });

  it('returns 0 for rescheduled classes', async () => {
    const { amount } = await calculateClassPayment('demo', 'rescheduled', new Date(2026, 7, 8));
    expect(amount).toBe(0);
  });

  it('returns 0 when no rule exists', async () => {
    mockRuleChain(null);
    const { amount } = await calculateClassPayment('regular', 'completed', new Date(2026, 7, 8));
    expect(amount).toBe(0);
  });

  it('returns the rule amount and a snapshot for a completed regular class', async () => {
    mockRuleChain(mockRule({ amount: 300 }));
    const { amount, rule } = await calculateClassPayment('regular', 'completed', new Date(2026, 7, 8));
    expect(amount).toBe(300);
    expect(rule).toEqual({
      classType: 'regular',
      status: 'completed',
      amount: 300,
      ruleId: 'rule-1',
    });
  });
});

describe('buildClassRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings(10, 15);
  });

  it('builds a complete class record with month and payment window', async () => {
    mockRuleChain(mockRule({ amount: 300 }));

    const record = await buildClassRecord(new Date(2026, 7, 8), 'regular', 'completed');

    expect(record.paymentAmount).toBe(300);
    expect(record.classMonth).toBe('2026-08');
    expect(record.paymentMonth).toBe('2026-09');
    expect(record.paymentWindowStart).toEqual(new Date(2026, 8, 10));
    expect(record.paymentWindowEnd).toEqual(new Date(2026, 8, 15));
    expect(record.paymentRuleSnapshot).toEqual({
      classType: 'regular',
      status: 'completed',
      amount: 300,
      ruleId: 'rule-1',
    });
  });

  it('builds the December class with January payment window across years', async () => {
    mockRuleChain(mockRule({ amount: 300 }));

    const record = await buildClassRecord(new Date(2026, 11, 20), 'regular', 'completed');

    expect(record.classMonth).toBe('2026-12');
    expect(record.paymentMonth).toBe('2027-01');
    expect(record.paymentWindowStart).toEqual(new Date(2027, 0, 10));
    expect(record.paymentWindowEnd).toEqual(new Date(2027, 0, 15));
  });

  it('uses the settings payment window', async () => {
    mockRuleChain(mockRule({ amount: 300 }));
    mockSettings(1, 5);

    const record = await buildClassRecord(new Date(2026, 7, 8), 'regular', 'completed');
    expect(record.paymentWindowStart).toEqual(new Date(2026, 8, 1));
    expect(record.paymentWindowEnd).toEqual(new Date(2026, 8, 5));
  });

  it('preserves the historical rule amount when a class is created', async () => {
    // Class created in August uses the August rule
    mockRuleChain(mockRule({ amount: 300 }));
    const augustRecord = await buildClassRecord(new Date(2026, 7, 15), 'regular', 'completed');
    expect(augustRecord.paymentAmount).toBe(300);

    // Later, the rule changes to 350 for a September class
    mockRuleChain(mockRule({ amount: 350 }));
    const septemberRecord = await buildClassRecord(new Date(2026, 8, 1), 'regular', 'completed');
    expect(septemberRecord.paymentAmount).toBe(350);

    // The August snapshot is preserved
    expect(augustRecord.paymentRuleSnapshot?.amount).toBe(300);
    expect(septemberRecord.paymentRuleSnapshot?.amount).toBe(350);
  });
});
