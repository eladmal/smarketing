import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/entities/base.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Entity('campaign_metrics')
export class CampaignMetrics extends BaseEntity {
  @Column({ name: 'campaign_id' })
  campaignId: number;

  @Column()
  platform: string;

  @Column({ type: 'bigint', default: 0 })
  impressions: number;

  @Column({ type: 'bigint', default: 0 })
  clicks: number;

  @Column({ type: 'bigint', default: 0 })
  conversions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  spend: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
  ctr: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  cpc: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  cpm: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
  roas: number;

  @Column({ type: 'bigint', default: 0 })
  reach: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  frequency: number;

  @Column({ name: 'raw_data', type: 'simple-json', nullable: true })
  rawData: Record<string, any>;

  @Column({ name: 'recorded_at', type: 'datetime' })
  recordedAt: Date;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}
