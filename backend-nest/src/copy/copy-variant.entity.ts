import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/entities/base.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Entity('copy_variants')
export class CopyVariant extends BaseEntity {
  @Column({ name: 'campaign_id' })
  campaignId: number;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  language: string;

  @Column({ name: 'variant_type', nullable: true })
  variantType: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_selected', default: false })
  isSelected: boolean;

  @ManyToOne(() => Campaign, (c) => c.copyVariants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}
