import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/entities/base.entity';
import { User } from '../users/user.entity';
import { CopyVariant } from '../copy/copy-variant.entity';
import { Audience } from '../audiences/audience.entity';
import { Asset } from '../assets/asset.entity';
import { Alert } from '../alerts/alert.entity';

export enum CampaignStatus {
  DRAFT    = 'draft',
  READY    = 'ready',
  LIVE     = 'live',
  PAUSED   = 'paused',
  EXPORTED = 'exported',
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR   = 'error',
  UNKNOWN = 'unknown',
}

@Entity('campaigns')
export class Campaign extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  goal: string;

  @Column({ name: 'product_name', nullable: true })
  productName: string;

  @Column({ name: 'product_description', type: 'text', nullable: true })
  productDescription: string;

  @Column({ name: 'target_audience', type: 'text', nullable: true })
  targetAudience: string;

  @Column({ nullable: true })
  budget: string;

  @Column({ default: 'he' })
  language: string;

  @Column({ type: 'simple-json', nullable: true })
  platforms: string[];

  @Column({ type: 'varchar', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ name: 'health_status', type: 'varchar', enum: HealthStatus, default: HealthStatus.UNKNOWN })
  healthStatus: HealthStatus;

  @Column({ name: 'last_health_check', nullable: true })
  lastHealthCheck: Date;

  @Column({ name: 'last_optimized_at', nullable: true })
  lastOptimizedAt: Date;

  @Column({ name: 'external_ids', type: 'simple-json', nullable: true })
  externalIds: Record<string, string>;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (u) => u.campaigns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @OneToMany(() => CopyVariant, (c) => c.campaign, { cascade: true })
  copyVariants: CopyVariant[];

  @OneToMany(() => Audience, (a) => a.campaign, { cascade: true })
  audiences: Audience[];

  @OneToMany(() => Asset, (a) => a.campaign)
  assets: Asset[];

  @OneToMany(() => Alert, (a) => a.campaign)
  alerts: Alert[];
}
