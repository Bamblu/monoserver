import { Module } from '@nestjs/common';
import { GithubIntegrationController } from './github-integration.controller';
import { GithubIntegrationService } from './github-integration.service';
import { CryptoModule } from '../crypto/crypto.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CryptoModule, PrismaModule, AuthModule],
  controllers: [GithubIntegrationController],
  providers: [GithubIntegrationService],
})
export class GithubIntegrationModule {}
