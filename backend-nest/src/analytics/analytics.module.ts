import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignMetrics } from './campaign-metrics.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { AlertsModule } from '../alerts/alerts.module';
import { CopyModule } from '../copy/copy.module';
import { Campaign } from '../campaigns/campaign.entity';
import { CopyVariant } from '../copy/copy-variant.entity';
import { ClaudeService } from '../shared/services/claude.service';
import { SchedulerService } from '../shared/services/scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CampaignMetrics, Campaign, CopyVariant]),
    CampaignsModule,
    AlertsModule,
    CopyModule,
  ],
  providers: [AnalyticsService, ClaudeService, SchedulerService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
