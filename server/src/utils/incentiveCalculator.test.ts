import { describe, expect, it } from 'vitest';
import { hasCompletedClassSequence } from './incentiveCalculator';

describe('hasCompletedClassSequence', () => {
  it('requires every class number from one through the milestone', () => {
    expect(hasCompletedClassSequence([
      { class_no: 4, status: 'completed' },
    ], 4)).toBe(false);
  });

  it('passes when all class numbers are completed', () => {
    expect(hasCompletedClassSequence([
      { class_no: 1, status: 'completed' },
      { class_no: 2, status: 'completed' },
      { class_no: 3, status: 'completed' },
      { class_no: 4, status: 'completed' },
    ], 4)).toBe(true);
  });

  it('does not pass when a required class is not completed', () => {
    expect(hasCompletedClassSequence([
      { class_no: 1, status: 'completed' },
      { class_no: 2, status: 'completed' },
      { class_no: 3, status: 'cancelled' },
      { class_no: 4, status: 'completed' },
    ], 4)).toBe(false);
  });
});
