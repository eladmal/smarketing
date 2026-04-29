import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/entities/base.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Entity('audiences')
export class Audience extends BaseEntity {
  @Column({ name: 'campaign_id' })
  campaignId: number;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  name: string;

  @Column({ name: 'age_min', default: 18 })
  ageMin: number;

  @Column({ name: 'age_max', default: 65 })
  ageMax: number;

  @Column({ type: 'simple-json', nullable: true })
  genders: string[];

  @Column({ type: 'simple-json', nullable: true })
  locations: string[];

  @Column({ type: 'simple-json', nullable: true })
  interests: string[];

  @Column({ type: 'simple-json', nullable: true })
  behaviors: string[];

  @Column({ type: 'simple-json', nullable: true })
  languages: string[];

  @Column({ name: 'custom_audiences', type: 'text', nullable: true })
  customAudiences: string;

  @ManyToOne(() => Campaign, (c) => c.audiences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}
