import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CampaignMetrics } from './campaign-metrics.entity';
import { Campaign, CampaignStatus, HealthStatus } from '../campaigns/campaign.entity';
import { CampaignsService } from '../campaigns/campaigns.service';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/alert.entity';
import { ClaudeService } from '../shared/services/claude.service';
import { CopyVariant } from '../copy/copy-variant.entity';

const PLATFORMS = ['facebook', 'instagram', 'google', 'tiktok'];

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(CampaignMetrics)
    private readonly metricsRepo: Repository<CampaignMetrics>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CopyVariant)
    private readonly copyRepo: Repository<CopyVariant>,
    private readonly campaignsService: CampaignsService,
    private readonly alertsService: AlertsService,
    private readonly claude: ClaudeService,
  ) {}

  async getOverview(userId: number): Promise<{
    totalCampaigns: number;
    liveCampaigns: number;
    healthyCampaigns: number;
    warningCampaigns: number;
    errorCampaigns: number;
    unreadAlerts: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
  }> {
    const campaigns = await this.campaignRepo.find({ where: { userId } });

    const total        = campaigns.length;
    const live         = campaigns.filter((c) => c.status === CampaignStatus.LIVE).length;
    const healthy      = campaigns.filter((c) => c.healthStatus === HealthStatus.HEALTHY).length;
    const warning      = campaigns.filter((c) => c.healthStatus === HealthStatus.WARNING).length;
    const error        = campaigns.filter((c) => c.healthStatus === HealthStatus.ERROR).length;
    const unreadAlerts = await this.alertsService.unreadCount(userId);

    // Aggregate metrics for this user's campaigns
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    if (campaigns.length > 0) {
      const campaignIds = campaigns.map((c) => c.id);
      const metrics = await this.metricsRepo.find({
        where: { campaignId: In(campaignIds) },
      });
      for (const m of metrics) {
        totalSpend       += Number(m.spend);
        totalImpressions += Number(m.impressions);
        totalClicks      += Number(m.clicks);
      }
    }

    return {
      totalCampaigns:    total,
      liveCampaigns:     live,
      healthyCampaigns:  healthy,
      warningCampaigns:  warning,
      errorCampaigns:    error,
      unreadAlerts,
      totalSpend:        Math.round(totalSpend * 100) / 100,
      totalImpressions,
      totalClicks,
    };
  }

  async getCampaignAnalytics(campaignId: number, userId: number): Promise<{
    campaign: Campaign;
    metrics: CampaignMetrics[];
    optimizationHistory: any[];
  }> {
    const campaign = await this.campaignsService.findOneOwned(campaignId, userId);

    // Latest metric per platform
    const allMetrics = await this.metricsRepo.find({
      where: { campaignId },
      order: { recordedAt: 'DESC' },
    });

    // Dedupe: keep the latest per platform
    const latestByPlatform = new Map<string, CampaignMetrics>();
    for (const m of allMetrics) {
      if (!latestByPlatform.has(m.platform)) {
        latestByPlatform.set(m.platform, m);
      }
    }

    const optimizationHistory: any[] = (campaign as any).optLogs ?? [];

    return {
      campaign,
      metrics: [...latestByPlatform.values()],
      optimizationHistory,
    };
  }

  async triggerHealthCheck(
    campaignId: number,
    userId: number,
  ): Promise<{ status: HealthStatus; issues: string[] }> {
    const campaign = await this.campaignsService.findOneOwned(campaignId, userId);

    const issues: string[] = [];

    // Check 1: Missing copy variants
    const copyCount = await this.copyRepo.count({ where: { campaignId } });
    if (copyCount === 0) {
      issues.push('No copy variants generated for this campaign');
      await this.alertsService.createIfNotDuplicate({
        userId,
        campaignId,
        severity: AlertSeverity.WARNING,
        category: 'copy',
        title: 'Missing Copy',
        message: `Campaign "${campaign.name}" has no copy variants. Generate copy before publishing.`,
        actionUrl: `/campaigns/${campaignId}/copy`,
      });
    }

    // Check 2: CTR health (from latest metrics)
    const metrics = await this.metricsRepo.find({
      where: { campaignId },
      order: { recordedAt: 'DESC' },
      take: 10,
    });

    const latestByPlatform = new Map<string, CampaignMetrics>();
    for (const m of metrics) {
      if (!latestByPlatform.has(m.platform)) {
        latestByPlatform.set(m.platform, m);
      }
    }

    for (const [platform, m] of latestByPlatform) {
      const ctr       = Number(m.ctr);
      const frequency = Number(m.frequency);
      const roas      = Number(m.roas);

      if (m.impressions > 1000 && ctr < 0.005) {
        issues.push(`Low CTR on ${platform}: ${(ctr * 100).toFixed(2)}% (below 0.5% threshold)`);
        await this.alertsService.createIfNotDuplicate({
          userId,
          campaignId,
          severity: AlertSeverity.WARNING,
          category: 'performance',
          title: `Low CTR — ${platform}`,
          message: `CTR on ${platform} is ${(ctr * 100).toFixed(2)}%, below the 0.5% threshold. Consider refreshing ad creative.`,
          actionUrl: `/campaigns/${campaignId}/copy`,
        });
      }

      if (frequency > 4) {
        issues.push(`High ad frequency on ${platform}: ${frequency.toFixed(1)} (above 4 threshold)`);
        await this.alertsService.createIfNotDuplicate({
          userId,
          campaignId,
          severity: AlertSeverity.WARNING,
          category: 'performance',
          title: `High Frequency — ${platform}`,
          message: `Ad frequency on ${platform} is ${frequency.toFixed(1)}. Audience may be experiencing fatigue.`,
          actionUrl: `/campaigns/${campaignId}`,
        });
      }

      if (m.spend > 0 && roas < 1) {
        issues.push(`Negative ROAS on ${platform}: ${roas.toFixed(2)} (below 1.0 threshold)`);
        await this.alertsService.createIfNotDuplicate({
          userId,
          campaignId,
          severity: AlertSeverity.ERROR,
          category: 'performance',
          title: `Negative ROAS — ${platform}`,
          message: `ROAS on ${platform} is ${roas.toFixed(2)}, indicating campaign is spending more than it earns.`,
          actionUrl: `/campaigns/${campaignId}`,
        });
      }
    }

    // Check 3: Campaign platforms configured
    if (!campaign.platforms || campaign.platforms.length === 0) {
      issues.push('No platforms selected for this campaign');
    }

    // Determine health status
    let status: HealthStatus;
    const hasErrors   = issues.some((i) => i.toLowerCase().includes('negative roas'));
    const hasWarnings = issues.length > 0;

    if (hasErrors) {
      status = HealthStatus.ERROR;
    } else if (hasWarnings) {
      status = HealthStatus.WARNING;
    } else {
      status = HealthStatus.HEALTHY;
    }

    // Persist
    await this.campaignRepo.update(campaignId, {
      healthStatus: status,
      lastHealthCheck: new Date(),
    });

    if (issues.length === 0) {
      await this.alertsService.createIfNotDuplicate({
        userId,
        campaignId,
        severity: AlertSeverity.SUCCESS,
        category: 'health',
        title: 'Health Check Passed',
        message: `Campaign "${campaign.name}" passed all health checks.`,
      }, 24);
    }

    return { status, issues };
  }

  async triggerOptimization(
    campaignId: number,
    userId: number,
  ): Promise<{ analysis: string; recommendations: any[]; performanceScore: number }> {
    const campaign = await this.campaignsService.findOneOwned(campaignId, userId);

    const metrics = await this.metricsRepo.find({
      where: { campaignId },
      order: { recordedAt: 'DESC' },
      take: 20,
    });

    const copyVariants = await this.copyRepo.find({ where: { campaignId }, take: 10 });

    const metricsMap: Record<string, any> = {};
    for (const m of metrics) {
      if (!metricsMap[m.platform]) {
        metricsMap[m.platform] = {
          impressions: Number(m.impressions),
          clicks:      Number(m.clicks),
          conversions: Number(m.conversions),
          spend:       Number(m.spend),
          ctr:         Number(m.ctr),
          cpc:         Number(m.cpc),
          roas:        Number(m.roas),
          reach:       Number(m.reach),
          frequency:   Number(m.frequency),
        };
      }
    }

    let result: any;
    try {
      result = await this.claude.analyzeForOptimization({
        campaignName: campaign.name,
        productName:  campaign.productName || '',
        goal:         campaign.goal || '',
        platforms:    campaign.platforms,
        metrics:      metricsMap,
        copyVariants: copyVariants.map((cv) => ({
          id:          cv.id,
          platform:    cv.platform,
          variantType: cv.variantType,
          content:     cv.content,
          isSelected:  cv.isSelected,
        })),
      });
    } catch (err) {
      this.logger.error(`Claude optimization failed for campaign ${campaignId}: ${err.message}`);
      result = {
        analysis: 'Optimization analysis unavailable — Claude service error.',
        performance_score: 5,
        recommendations: [],
      };
    }

    // Apply high-priority copy suggestions automatically
    const highPriorityCopy = (result.recommendations || []).filter(
      (r: any) => r.type === 'copy_update' && r.priority === 'high' && r.suggested_content,
    );

    for (const rec of highPriorityCopy.slice(0, 3)) {
      // Create new copy variant with suggested content
      try {
        const newVariant = this.copyRepo.create({
          campaignId,
          platform:    rec.platform || campaign.platforms[0],
          variantType: 'body',
          content:     rec.suggested_content,
          isSelected:  false,
          language:    campaign.language,
        });
        await this.copyRepo.save(newVariant);
      } catch (err) {
        this.logger.warn(`Could not save copy suggestion: ${err.message}`);
      }
    }

    // Update campaign last optimized timestamp
    await this.campaignRepo.update(campaignId, { lastOptimizedAt: new Date() });

    // Create optimization alert
    await this.alertsService.create({
      userId,
      campaignId,
      severity: AlertSeverity.INFO,
      category: 'optimization',
      title: 'AI Optimization Complete',
      message: `Campaign "${campaign.name}" analyzed. Score: ${result.performance_score}/10. ${result.recommendations?.length || 0} recommendations generated.`,
      actionUrl: `/campaigns/${campaignId}`,
    });

    return {
      analysis:         result.analysis || '',
      recommendations:  result.recommendations || [],
      performanceScore: result.performance_score || 0,
    };
  }

  // ─── Internal: used by scheduler ────────────────────────────────────────────

  async findAllLiveAndReadyCampaigns(): Promise<Campaign[]> {
    return this.campaignRepo.find({
      where: [
        { status: CampaignStatus.LIVE },
        { status: CampaignStatus.READY },
      ],
    });
  }

  async findCampaignsNeedingOptimization(sinceHours: number): Promise<Campaign[]> {
    const cutoff = new Date(Date.now() - sinceHours * 3_600_000);
    return this.campaignRepo
      .createQueryBuilder('c')
      .where('c.status IN (:...statuses)', { statuses: [CampaignStatus.LIVE, CampaignStatus.READY] })
      .andWhere('(c.last_optimized_at IS NULL OR c.last_optimized_at < :cutoff)', { cutoff })
      .getMany();
  }

  async pullMetrics(campaignId: number): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) return;

    // Simulate pulling metrics with realistic random data per platform
    for (const platform of campaign.platforms) {
      const impressions  = Math.floor(Math.random() * 50_000) + 1_000;
      const clicks       = Math.floor(impressions * (Math.random() * 0.05 + 0.005));
      const conversions  = Math.floor(clicks * (Math.random() * 0.1 + 0.01));
      const spend        = Math.round((Math.random() * 500 + 10) * 100) / 100;
      const ctr          = clicks / impressions;
      const cpc          = clicks > 0 ? spend / clicks : 0;
      const cpm          = (spend / impressions) * 1000;
      const revenue      = conversions * (Math.random() * 100 + 20);
      const roas         = spend > 0 ? revenue / spend : 0;
      const reach        = Math.floor(impressions * (Math.random() * 0.4 + 0.6));
      const frequency    = impressions / (reach || 1);

      const entry = this.metricsRepo.create({
        campaignId,
        platform,
        impressions,
        clicks,
        conversions,
        spend,
        ctr:       Math.round(ctr * 10000) / 10000,
        cpc:       Math.round(cpc * 10000) / 10000,
        cpm:       Math.round(cpm * 10000) / 10000,
        roas:      Math.round(roas * 10000) / 10000,
        reach,
        frequency: Math.round(frequency * 100) / 100,
        rawData:   { simulated: true, pulledAt: new Date().toISOString() },
        recordedAt: new Date(),
      });

      await this.metricsRepo.save(entry);
    }
  }
}
