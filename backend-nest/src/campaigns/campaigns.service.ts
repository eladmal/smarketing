import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly repo: Repository<Campaign>,
  ) {}

  findAllByUser(userId: number) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneOwned(id: number, userId: number) {
    const campaign = await this.repo.findOne({
      where: { id },
      relations: ['copyVariants', 'audiences', 'assets'],
    });
    if (!campaign) throw new NotFoundException('קמפיין לא נמצא');
    if (campaign.userId !== userId) throw new ForbiddenException('אין גישה לקמפיין זה');
    return campaign;
  }

  async create(userId: number, data: Partial<Campaign>) {
    const campaign = this.repo.create({ ...data, userId });
    return this.repo.save(campaign);
  }

  async update(id: number, userId: number, data: Partial<Campaign>) {
    await this.findOneOwned(id, userId);
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number, userId: number) {
    await this.findOneOwned(id, userId);
    await this.repo.delete(id);
  }
}
