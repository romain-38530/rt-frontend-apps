import cron from 'node-cron';
import { calculateMonthlyCommissions } from './commission-calculator';
import { sendMonthlyCommissionSummary } from './email-service';

/**
 * Initialize the monthly commission scheduler
 * Runs on the 1st of each month at 00:00
 */
export function initScheduler(): void {
  // Schedule: Run at 00:00 on the 1st of every month
  // Cron format: minute hour day month day-of-week
  const schedule = '0 0 1 * *';

  cron.schedule(schedule, async () => {
    try {
      const now = new Date();
      const lastMonth = now.getMonth(); // getMonth() is 0-indexed, so this gives us last month
      const year = lastMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month = lastMonth === 0 ? 12 : lastMonth;

      console.log(`========================================`);
      console.log(`Starting monthly commission calculation`);
      console.log(`Period: ${month}/${year}`);
      console.log(`Date: ${new Date().toISOString()}`);
      console.log(`========================================`);

      // Calculate commissions for all active agents
      const commissions = await calculateMonthlyCommissions(month, year);

      console.log(`✓ Calculated ${commissions.length} commissions`);

      // Send summary emails to agents
      await sendMonthlyCommissionSummary(month, year);

      console.log(`✓ Sent commission summary emails`);
      console.log(`========================================`);
      console.log(`Monthly commission calculation completed`);
      console.log(`========================================`);
    } catch (error) {
      console.error('Error in monthly commission scheduler:', error);
    }
  });

  console.log('✓ Monthly commission scheduler initialized (runs 1st of each month at 00:00)');
}

/**
 * Run commission calculation manually (for testing or manual triggers)
 */
export async function runManualCommissionCalculation(month?: number, year?: number): Promise<void> {
  try {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    console.log(`========================================`);
    console.log(`Manual commission calculation`);
    console.log(`Period: ${targetMonth}/${targetYear}`);
    console.log(`========================================`);

    const commissions = await calculateMonthlyCommissions(targetMonth, targetYear);

    console.log(`✓ Calculated ${commissions.length} commissions`);
    console.log(`========================================`);

    return;
  } catch (error) {
    console.error('Error in manual commission calculation:', error);
    throw error;
  }
}

/**
 * Schedule document expiration checks (runs daily at 01:00)
 */
export function scheduleDocumentExpirationCheck(): void {
  const schedule = '0 1 * * *'; // Daily at 01:00

  cron.schedule(schedule, async () => {
    try {
      console.log('Checking for expired documents...');

      // Import Agent model here to avoid circular dependencies
      const Agent = (await import('../models/Agent')).default;

      const agents = await Agent.find({ status: 'active' });

      const now = new Date();
      let expiredCount = 0;

      for (const agent of agents) {
        let hasExpiredDocs = false;

        for (const doc of agent.documents) {
          if (doc.expiresAt && doc.expiresAt < now && doc.verified) {
            doc.verified = false;
            hasExpiredDocs = true;
            expiredCount++;
          }
        }

        if (hasExpiredDocs) {
          agent.status = 'non_compliant';
          await agent.save();

          console.log(`Agent ${agent.agentId} marked as non-compliant due to expired documents`);
        }
      }

      console.log(`✓ Document expiration check completed (${expiredCount} expired documents)`);
    } catch (error) {
      console.error('Error in document expiration check:', error);
    }
  });

  console.log('✓ Document expiration checker initialized (runs daily at 01:00)');
}

/**
 * Initialize all schedulers
 */
export function initAllSchedulers(): void {
  initScheduler();
  scheduleDocumentExpirationCheck();
}
