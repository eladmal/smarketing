import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsService } from '../../analytics/analytics.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * Health checks on all live/ready campaigns — every 30 minutes.
   * Cron: second=0, every 30 min
   */
  @Cron('0 */30 * * * *', { name: 'health_checks' })
  async runHealthChecks(): Promise<void> {
    this.logger.log('[Scheduler] Starting periodic health checks...');
    let processed = 0;
    let failed = 0;

    try {
      const campaigns = await this.analytics.findAllLiveAndReadyCampaigns();
      this.logger.log(`[Scheduler] Health check: found ${campaigns.length} campaigns to check`);

      for (const campaign of campaigns) {
        try {
          await this.analytics.triggerHealthCheck(campaign.id, campaign.userId);
          processed++;
        } catch (err) {
          failed++;
          this.logger.warn(
            `[Scheduler] Health check failed for campaign ${campaign.id}: ${err.message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`[Scheduler] Health check job error: ${err.message}`);
    }

    this.logger.log(
      `[Scheduler] Health checks complete — processed: ${processed}, failed: ${failed}`,
    );
  }

  /**
   * Pull simulated metrics for all live campaigns — every 6 hours.
   * Cron: second=0, minute=0, every 6 hours
   */
  @Cron('0 0 */6 * * *', { name: 'pull_metrics' })
  async pullMetrics(): Promise<void> {
    this.logger.log('[Scheduler] Starting periodic metrics pull...');
    let processed = 0;
    let failed = 0;

    try {
      const campaigns = await this.analytics.findAllLiveAndReadyCampaigns();
      this.logger.log(`[Scheduler] Metrics pull: found ${campaigns.length} campaigns`);

      for (const campaign of campaigns) {
        try {
          await this.analytics.pullMetrics(campaign.id);
          processed++;
        } catch (err) {
          failed++;
          this.logger.warn(
            `[Scheduler] Metrics pull failed for campaign ${campaign.id}: ${err.message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`[Scheduler] Metrics pull job error: ${err.message}`);
    }

    this.logger.log(
      `[Scheduler] Metrics pull complete — processed: ${processed}, failed: ${failed}`,
    );
  }

  /**
   * AI optimization on campaigns not optimized in 48 hours.
   * Cron: second=0, minute=0, every 48 hours
   */
  @Cron('0 0 */48 * * *', { name: 'ai_optimization' })
  async runAiOptimization(): Promise<void> {
    this.logger.log('[Scheduler] Starting periodic AI optimization...');
    let processed = 0;
    let failed = 0;

    try {
      const campaigns = await this.analytics.findCampaignsNeedingOptimization(48);
      this.logger.log(
        `[Scheduler] AI optimization: found ${campaigns.length} campaigns needing optimization`,
      );

      for (const campaign of campaigns) {
        try {
          await this.analytics.triggerOptimization(campaign.id, campaign.userId);
          processed++;
        } catch (err) {
          failed++;
          this.logger.warn(
            `[Scheduler] AI optimization failed for campaign ${campaign.id}: ${err.message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`[Scheduler] AI optimization job error: ${err.message}`);
    }

    this.logger.log(
      `[Scheduler] AI optimization complete — processed: ${processed}, failed: ${failed}`,
    );
  }
}
