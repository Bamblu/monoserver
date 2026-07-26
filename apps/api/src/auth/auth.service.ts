import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateOAuthLogin(profile: any) {
    const { provider, providerAccountId, email, name, picture, accessToken } = profile;

    // Find existing OAuth account
    let account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: {
          include: {
            githubConnections: {
              select: { id: true, username: true, connectedAt: true },
            },
          },
        },
      },
    });

    if (account) {
      // Refresh access token
      await this.prisma.account.update({
        where: { id: account.id },
        data: { accessToken },
      });
      return { user: account.user, provider };
    }

    // Check if a user with this email already exists
    let user = email
      ? await this.prisma.user.findUnique({
          where: { email },
          include: {
            githubConnections: {
              select: { id: true, username: true, connectedAt: true },
            },
          },
        })
      : null;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: email || `${providerAccountId}@${provider}.placeholder.com`,
          name,
          image: picture,
        },
        include: {
          githubConnections: {
            select: { id: true, username: true, connectedAt: true },
          },
        },
      });
    }

    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider,
        providerAccountId,
        accessToken,
      },
    });

    return { user, provider };
  }

  /**
   * Determines if a user has completed all onboarding steps.
   * Onboarding is complete when:
   *  - User has a linked GitHub connection (proves platform access)
   *  - User has a Codeforces handle set
   */
  isOnboardingComplete(user: any, loginProvider: string): boolean {
    const hasGitHub =
      loginProvider === 'github' || // GitHub was the login provider itself
      (user.githubConnections && user.githubConnections.length > 0);
    const hasCf = !!user.codeforcesHandle;
    return hasGitHub && hasCf;
  }

  generateJwt(user: any, provider: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      provider, // stored so frontend knows which steps to show
    };
    return this.jwtService.sign(payload);
  }
}
