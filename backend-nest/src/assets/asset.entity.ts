import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/entities/base.entity';
import { User } from '../users/user.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Entity('assets')
export class Asset extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId: number;

  @Column({ name: 'original_filename', nullable: true })
  originalFilename: string;

  @Column({ name: 'file_path', nullable: true })
  filePath: string;

  @Column({ name: 'file_type', nullable: true })
  fileType: string;

  @Column({ name: 'resized_variants', type: 'simple-json', nullable: true })
  resizedVariants: any[];

  @ManyToOne(() => User, (u) => u.assets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @ManyToOne(() => Campaign, (c) => c.assets, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}
