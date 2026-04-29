import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audience } from './audience.entity';
import { CampaignsService } from '../campaigns/campaigns.service';
import { ClaudeService } from '../shared/services/claude.service';

@Injectable()
export class AudiencesService {
  constructor(
    @InjectRepository(Audience) private readonly repo: Repository<Audience>,
    private readonly campaigns: CampaignsService,
    private readonly claude: ClaudeService,
  ) {}

  async generate(campaignId: number, userId: number) {
    const campaign = await this.campaigns.findOneOwned(campaignId, userId);
    const result = await this.claude.generateAudienceSuggestions({
      productName: campaign.productName,
      productDescription: campaign.productDescription,
      goal: campaign.goal,
      platforms: campaign.platforms,
    });

    await this.repo.delete({ campaignId });
    const entities: Audience[] = [];

    for (const [platform, data] of Object.entries(result as Record<string, any>)) {
      entities.push(this.repo.create({
        campaignId,
        platform,
        name: `קהל ${platform}`,
        ageMin: data.age_min || 18,
        ageMax: data.age_max || 65,
        genders: data.genders || ['all'],
        locations: data.locations || [],
        interests: data.interests || [],
        behaviors: data.behaviors || [],
        customAudiences: JSON.stringify(data.special_audiences || []),
      }));
    }
    return this.repo.save(entities);
  }

  findByCampaign(campaignId: number, userId: number) {
    return this.campaigns.findOneOwned(campaignId, userId).then(() =>
      this.repo.find({ where: { campaignId } })
    );
  }

  async remove(id: number, userId: number) {
    const aud = await this.repo.findOne({ where: { id }, relations: ['campaign'] });
    if (!aud) throw new NotFoundException();
    if (aud.campaign.userId !== userId) throw new ForbiddenException();
    await this.repo.delete(id);
  }
}
