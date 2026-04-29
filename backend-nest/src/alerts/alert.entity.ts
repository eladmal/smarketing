import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/entities/base.entity';
import { User } from '../users/user.entity';
import { Campaign } from '../campaigns/campaign.entity';

export enum AlertSeverity {
  INFO    = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR   = 'error',
}

@Entity('alerts')
export class Alert extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId: number;

  @Column({ type: 'varchar', enum: AlertSeverity, default: AlertSeverity.INFO })
  severity: AlertSeverity;

  @Column({ nullable: true })
  category: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'action_url', nullable: true })
  actionUrl: string;

  @ManyToOne(() => User, (u) => u.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @ManyToOne(() => Campaign, (c) => c.alerts, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}
