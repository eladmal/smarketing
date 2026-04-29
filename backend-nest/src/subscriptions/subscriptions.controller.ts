import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { ConfigService } from '@nestjs/config';
import { PlanType } from './subscription.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly config: ConfigService,
  ) {}

  // ─── Get current subscription ──────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get my subscription status' })
  async getMy(@CurrentUser() user: User) {
    const sub = await this.subscriptionsService.getForUser(user.id);
    return this.subscriptionsService.summarize(sub);
  }

  // ─── Create Stripe checkout ────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  createCheckout(@CurrentUser() user: User, @Body() dto: CreateCheckoutDto) {
    return this.subscriptionsService.createCheckoutSession(user, dto.plan);
  }

  // ─── Open customer portal ──────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('portal')
  @ApiOperation({ summary: 'Open Stripe customer portal' })
  openPortal(@CurrentUser() user: User) {
    return this.subscriptionsService.createPortalSession(user);
  }

  // ─── Stripe webhook (no auth guard — verified by signature) ───────────────
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.subscriptionsService.handleStripeWebhook(req.rawBody!, sig);
  }

  // ─── Dev-mode: simulate payment (only when STRIPE_SECRET_KEY is missing) ─
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('dev-activate')
  @ApiOperation({ summary: '[Dev] Simulate plan activation without Stripe' })
  devActivate(@CurrentUser() user: User, @Body() dto: { plan: PlanType }) {
    if (this.config.get('NODE_ENV') === 'production') {
      return { error: 'Not available in production' };
    }
    return this.subscriptionsService.devActivate(user.id, dto.plan);
  }
}
