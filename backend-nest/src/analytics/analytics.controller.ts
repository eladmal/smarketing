import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: User) {
    return this.svc.getOverview(user.id);
  }

  @Get('campaign/:id')
  getCampaignAnalytics(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.svc.getCampaignAnalytics(id, user.id);
  }

  @Post('health-check/:id')
  triggerHealthCheck(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.svc.triggerHealthCheck(id, user.id);
  }

  @Post('optimize/:id')
  triggerOptimization(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.svc.triggerOptimization(id, user.id);
  }
}
