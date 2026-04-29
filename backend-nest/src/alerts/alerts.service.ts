import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertSeverity } from './alert.entity';

@Injectable()
export class AlertsService {
  constructor(@InjectRepository(Alert) private readonly repo: Repository<Alert>) {}

  findAll(userId: number, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;
    return this.repo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }

  async unreadCount(userId: number) {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async markRead(id: number, userId: number) {
    await this.repo.update({ id, userId }, { isRead: true });
  }

  async markAllRead(userId: number) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  async remove(id: number, userId: number) {
    await this.repo.delete({ id, userId });
  }

  create(data: Partial<Alert>) {
    const alert = this.repo.create(data);
    return this.repo.save(alert);
  }

  async createIfNotDuplicate(data: Partial<Alert>, dedupeHours = 6) {
    const cutoff = new Date(Date.now() - dedupeHours * 3_600_000);
    const existing = await this.repo.findOne({
      where: { userId: data.userId, campaignId: data.campaignId, title: data.title } as any,
    });
    if (existing && existing.createdAt > cutoff) return existing;
    return this.create(data);
  }
}
