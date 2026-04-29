import { Controller, Get, Put, Delete, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly svc: AlertsService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('unread') unread?: string) {
    return this.svc.findAll(user.id, unread === 'true');
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: User) {
    return { count: await this.svc.unreadCount(user.id) };
  }

  @Put('read-all')
  markAllRead(@CurrentUser() user: User) {
    return this.svc.markAllRead(user.id);
  }

  @Put(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.svc.markRead(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.svc.remove(id, user.id);
  }
}
