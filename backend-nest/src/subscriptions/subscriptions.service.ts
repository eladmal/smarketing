import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require('stripe');
import {
  Subscription,
  PlanType,
  SubscriptionStatus,
  PLAN_PRICES_ILS,
  PLAN_LIMITS,
} from './subscription.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stripe: any = null;

  constructor(
    @InjectRepository(Subscription)
    private readonly repo: Repository<Subscription>,
    private readonly config: ConfigService,
  ) {
    const stripeKey = config.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set — running in dev/demo mode (no real payments)');
    }
  }

  // ─── Create trial on registration ────────────────────────────────────────────
  async createTrial(user: User): Promise<Subscription> {
    const trialDays = Number(this.config.get('TRIAL_DAYS', 14));
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const sub = this.repo.create({
      userId: user.id,
      plan: PlanType.TRIAL,
      status: SubscriptionStatus.TRIAL,
      trialEndsAt,
    });
    return this.repo.save(sub);
  }

  // ─── Get active subscription for user ────────────────────────────────────────
  async getForUser(userId: number): Promise<Subscription | null> {
    return this.repo.findOne({ where: { userId } });
  }

  // ─── Check if subscription is currently valid ─────────────────────────────────
  isValid(sub: Subscription | null): boolean {
    if (!sub) return false;
    if (sub.status === SubscriptionStatus.ACTIVE) return true;
    if (sub.status === SubscriptionStatus.TRIAL && sub.trialEndsAt && sub.trialEndsAt > new Date()) return true;
    return false;
  }

  // ─── Get plan limits ──────────────────────────────────────────────────────────
  getLimits(sub: Subscription | null) {
    if (!sub) return PLAN_LIMITS[PlanType.TRIAL];
    return PLAN_LIMITS[sub.plan];
  }

  // ─── Create Stripe Checkout Session ──────────────────────────────────────────
  async createCheckoutSession(user: User, plan: PlanType.BASIC | PlanType.PRO | PlanType.BUSINESS) {
    const priceId = this._getPriceId(plan);
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');

    // Dev mode — no Stripe key
    if (!this.stripe || !priceId) {
      this.logger.log(`[Dev mode] Simulating ${plan} checkout for user ${user.id}`);
      return { url: `${frontendUrl}/billing/success?plan=${plan}&dev=1`, devMode: true };
    }

    // Get or create Stripe customer
    let customerId = (await this.getForUser(user.id))?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/billing`,
      metadata: { userId: String(user.id), plan },
      subscription_data: {
        metadata: { userId: String(user.id), plan },
      },
    });

    return { url: session.url };
  }

  // ─── Create Stripe Customer Portal ───────────────────────────────────────────
  async createPortalSession(user: User) {
    const sub = await this.getForUser(user.id);
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');

    if (!this.stripe || !sub?.stripeCustomerId) {
      return { url: `${frontendUrl}/billing` };
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  // ─── Handle Stripe Webhook ────────────────────────────────────────────────────
  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) return { received: true };

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) throw new BadRequestException('Webhook secret not configured');

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this._handleCheckoutCompleted(event.data.object as any);
        break;
      case 'invoice.payment_succeeded':
        await this._handlePaymentSucceeded(event.data.object as any);
        break;
      case 'invoice.payment_failed':
        await this._handlePaymentFailed(event.data.object as any);
        break;
      case 'customer.subscription.deleted':
        await this._handleSubscriptionDeleted(event.data.object as any);
        break;
    }

    return { received: true };
  }

  // ─── Dev-mode: simulate activation ───────────────────────────────────────────
  async devActivate(userId: number, plan: PlanType) {
    const sub = await this.getForUser(userId);
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (!sub) {
      await this.repo.save(
        this.repo.create({
          userId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        }),
      );
    } else {
      await this.repo.update(sub.id, {
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    }

    return { success: true, plan };
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────────
  private _getPriceId(plan: PlanType): string | null {
    const map: Record<PlanType, string> = {
      [PlanType.BASIC]: this.config.get<string>('STRIPE_PRICE_BASIC', ''),
      [PlanType.PRO]: this.config.get<string>('STRIPE_PRICE_PRO', ''),
      [PlanType.BUSINESS]: this.config.get<string>('STRIPE_PRICE_BUSINESS', ''),
      [PlanType.TRIAL]: '',
    };
    return map[plan] || null;
  }

  private async _handleCheckoutCompleted(session: any) {
    const userId = Number(session.metadata?.userId);
    const plan = session.metadata?.plan as PlanType;
    if (!userId || !plan) return;

    const sub = await this.getForUser(userId);
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (!sub) {
      await this.repo.save(
        this.repo.create({
          userId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        }),
      );
    } else {
      await this.repo.update(sub.id, {
        plan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    }
  }

  private async _handlePaymentSucceeded(invoice: any) {
    const subId = (invoice as any).subscription as string;
    if (!subId) return;
    const sub = await this.repo.findOne({ where: { stripeSubscriptionId: subId } });
    if (!sub) return;

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await this.repo.update(sub.id, {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    });
  }

  private async _handlePaymentFailed(invoice: any) {
    const subId = (invoice as any).subscription as string;
    if (!subId) return;
    const sub = await this.repo.findOne({ where: { stripeSubscriptionId: subId } });
    if (sub) await this.repo.update(sub.id, { status: SubscriptionStatus.PAST_DUE });
  }

  private async _handleSubscriptionDeleted(stripeSub: any) {
    const sub = await this.repo.findOne({ where: { stripeSubscriptionId: stripeSub.id } });
    if (sub) {
      await this.repo.update(sub.id, {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      });
    }
  }

  // ─── Summarise subscription for API response ─────────────────────────────────
  summarize(sub: Subscription | null) {
    if (!sub) {
      return {
        plan: PlanType.TRIAL,
        status: SubscriptionStatus.EXPIRED,
        valid: false,
        trialEndsAt: null,
        currentPeriodEnd: null,
        limits: PLAN_LIMITS[PlanType.TRIAL],
        priceIls: 0,
      };
    }

    return {
      plan: sub.plan,
      status: sub.status,
      valid: this.isValid(sub),
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      limits: this.getLimits(sub),
      priceIls: PLAN_PRICES_ILS[sub.plan],
    };
  }
}
