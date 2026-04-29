import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/entities/base.entity';
import { User } from '../users/user.entity';

export enum PlanType {
  TRIAL = 'trial',
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export const PLAN_LIMITS: Record<PlanType, { campaigns: number; platforms: number; aiOptimization: boolean; whiteLabel: boolean }> = {
  [PlanType.TRIAL]: { campaigns: 3, platforms: 2, aiOptimization: false, whiteLabel: false },
  [PlanType.BASIC]: { campaigns: 5, platforms: 2, aiOptimization: false, whiteLabel: false },
  [PlanType.PRO]: { campaigns: -1, platforms: -1, aiOptimization: true, whiteLabel: false },
  [PlanType.BUSINESS]: { campaigns: -1, platforms: -1, aiOptimization: true, whiteLabel: true },
};

export const PLAN_PRICES_ILS: Record<PlanType, number> = {
  [PlanType.TRIAL]: 0,
  [PlanType.BASIC]: 99,
  [PlanType.PRO]: 299,
  [PlanType.BUSINESS]: 799,
};

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', default: PlanType.TRIAL })
  plan: PlanType;

  @Column({ type: 'varchar', default: SubscriptionStatus.TRIAL })
  status: SubscriptionStatus;

  // Stripe fields (null in trial / dev mode)
  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string;

  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'trial_ends_at', nullable: true })
  trialEndsAt: Date;

  @Column({ name: 'current_period_start', nullable: true })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', nullable: true })
  currentPeriodEnd: Date;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;
}
