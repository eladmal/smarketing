import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/user.entity';

class CreateCampaignDto {
  @IsString() name: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsString() productName?: string;
  @IsOptional() @IsString() productDescription?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsString() budget?: string;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsArray() platforms?: string[];
}

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly svc: CampaignsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.svc.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.svc.findOneOwned(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: User) {
    return this.svc.create(user.id, dto as any);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCampaignDto>,
    @CurrentUser() user: User,
  ) {
    return this.svc.update(id, user.id, dto as any);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.svc.remove(id, user.id);
  }
}
