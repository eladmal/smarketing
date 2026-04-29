import { IsEnum } from 'class-validator';
import { PlanType } from '../subscription.entity';

export class CreateCheckoutDto {
  @IsEnum([PlanType.BASIC, PlanType.PRO, PlanType.BUSINESS], { message: 'תוכנית לא תקינה' })
  plan: PlanType.BASIC | PlanType.PRO | PlanType.BUSINESS;
}
