import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/entities/base.entity';
import { User } from '../users/user.entity';

export enum ConnectionStatus {
  CONNECTED    = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR        = 'error',
  EXPIRED      = 'expired',
}

@Entity('platform_connections')
export class PlatformConnection extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  platform: string;

  @Column({ type: 'varchar', enum: ConnectionStatus, default: ConnectionStatus.DISCONNECTED })
  status: ConnectionStatus;

  // Encrypted with AES-256 — never stored plaintext in production
  @Column({ name: 'access_token_enc', type: 'text', nullable: true })
  accessTokenEnc: string;

  @Column({ name: 'refresh_token_enc', type: 'text', nullable: true })
  refreshTokenEnc: string;

  @Column({ name: 'token_expires_at', nullable: true })
  tokenExpiresAt: Date;

  @Column({ name: 'account_id', nullable: true })
  accountId: string;

  @Column({ name: 'account_name', nullable: true })
  accountName: string;

  @Column({ type: 'simple-json', nullable: true })
  scopes: string[];

  @Column({ name: 'extra_data', type: 'simple-json', nullable: true })
  extraData: Record<string, any>;

  @Column({ name: 'connected_at', nullable: true })
  connectedAt: Date;

  @ManyToOne(() => User, (u) => u.platformConnections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  owner: User;
}
