import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../shared/entities/base.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { Asset } from '../assets/asset.entity';
import { PlatformConnection } from '../integrations/platform-connection.entity';
import { Alert } from '../alerts/alert.entity';
import { Subscription } from '../subscriptions/subscription.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'hashed_password' })
  @Exclude()
  hashedPassword: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'business_name', nullable: true })
  businessName: string;

  @Column({ name: 'business_type', nullable: true })
  businessType: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => Campaign, (c) => c.owner)
  campaigns: Campaign[];

  @OneToMany(() => Asset, (a) => a.owner)
  assets: Asset[];

  @OneToMany(() => PlatformConnection, (p) => p.owner)
  platformConnections: PlatformConnection[];

  @OneToMany(() => Alert, (a) => a.owner)
  alerts: Alert[];

  @OneToOne(() => Subscription, (s) => s.user, { eager: false })
  subscription: Subscription;
}
