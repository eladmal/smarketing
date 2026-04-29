import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CopyVariant } from './copy-variant.entity';
import { CampaignsService } from '../campaigns/campaigns.service';
import { ClaudeService } from '../shared/services/claude.service';

@Injectable()
export class CopyService {
  constructor(
    @InjectRepository(CopyVariant) private readonly repo: Repository<CopyVariant>,
    private readonly campaigns: CampaignsService,
    private readonly claude: ClaudeService,
  ) {}

  async generate(campaignId: number, userId: number, tone?: string) {
    const campaign = await this.campaigns.findOneOwned(campaignId, userId);

    const result = await this.claude.generateCampaignCopy({
      productName: campaign.productName,
      productDescription: campaign.productDescription,
      businessName: (campaign.owner as any)?.businessName || 'העסק שלך',
      goal: campaign.goal,
      targetAudience: campaign.targetAudience,
      platforms: campaign.platforms,
      language: campaign.language,
      tone,
    });

    // Delete old, insert new
    await this.repo.delete({ campaignId });

    const entities: CopyVariant[] = [];
    for (const [platform, data] of Object.entries(result as Record<string, any>)) {
      for (const variant of data.variants || []) {
        for (const type of ['headline', 'body', 'cta'] as const) {
          if (variant[type]) {
            entities.push(this.repo.create({
              campaignId,
              platform,
              language: campaign.language,
              variantType: type,
              content: variant[type],
            }));
          }
        }
      }
    }

    return this.repo.save(entities);
  }

  async improve(copyId: number, userId: number, feedback: string) {
    const variant = await this.repo.findOne({
      where: { id: copyId },
      relations: ['campaign'],
    });
    if (!variant) throw new NotFoundException('קופי לא נמצא');
    if (variant.campaign.userId !== userId) throw new ForbiddenException();

    const improved = await this.claude.improveCopy(
      variant.content,
      variant.platform,
      variant.campaign.goal,
      feedback,
    );
    variant.content = improved;
    return this.repo.save(variant);
  }

  async remove(id: number, userId: number) {
    const variant = await this.repo.findOne({ where: { id }, relations: ['campaign'] });
    if (!variant) throw new NotFoundException();
    if (variant.campaign.userId !== userId) throw new ForbiddenException();
    await this.repo.delete(id);
  }
}
