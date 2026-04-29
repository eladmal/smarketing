import { Controller, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CopyService } from './copy.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/user.entity';

class GenerateCopyDto {
  @IsNumber() campaignId: number;
  @IsOptional() @IsString() tone?: string;
}

class ImproveCopyDto {
  @IsString() feedback: string;
}

@ApiTags('copy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('copy')
export class CopyController {
  constructor(private readonly svc: CopyService) {}

  @Post('generate')
  generate(@Body() dto: GenerateCopyDto, @CurrentUser() user: User) {
    return this.svc.generate(dto.campaignId, user.id, dto.tone);
  }

  @Post(':id/improve')
  improve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ImproveCopyDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.improve(id, user.id, dto.feedback);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.svc.remove(id, user.id);
  }
}
