import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { CryptoModule } from '../crypto/crypto.module';
import { GithubAuthGuard } from './github-auth.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    CryptoModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me-in-production',
      signOptions: { expiresIn: '7d' }, // 7-day tokens
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, GithubStrategy, JwtStrategy, GithubAuthGuard],
  exports: [AuthService, JwtModule, GithubAuthGuard],
})
export class AuthModule {}
