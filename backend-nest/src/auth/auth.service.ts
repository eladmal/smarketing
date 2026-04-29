import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('אימייל כבר קיים במערכת');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email.toLowerCase().trim(),
      hashedPassword,
      fullName: dto.fullName.trim(),
      businessName: dto.businessName?.trim(),
      businessType: dto.businessType,
    });

    // Create 14-day trial automatically on registration
    const sub = await this.subscriptionsService.createTrial(user);

    return this._buildResponse(user, sub);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase().trim());

    // Constant-time comparison prevents timing attacks
    const passwordMatch = user
      ? await bcrypt.compare(dto.password, user.hashedPassword)
      : await bcrypt.compare(dto.password, '$2b$12$invalidhashfortimingatk');

    if (!user || !passwordMatch || !user.isActive) {
      throw new UnauthorizedException('אימייל או סיסמה שגויים');
    }

    await this.usersService.updateLastLogin(user.id);
    const sub = await this.subscriptionsService.getForUser(user.id);
    return this._buildResponse(user, sub);
  }

  private _buildResponse(user: User, sub: any) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        businessType: user.businessType,
      },
      subscription: this.subscriptionsService.summarize(sub),
    };
  }
}
