import cron from 'node-cron';
import { recalculateAllStudentIncentives } from '../utils/incentiveCalculator';

let running = false;

export function startIncentiveCron(): void {
  cron.schedule('*/15 * * * *', async () => {
    if (running) return;
    running = true;
    try {
      await recalculateAllStudentIncentives();
      console.log('Scheduled incentive reconciliation completed');
    } catch (error) {
      console.error('Scheduled incentive reconciliation failed:', error);
    } finally {
      running = false;
    }
  });
}