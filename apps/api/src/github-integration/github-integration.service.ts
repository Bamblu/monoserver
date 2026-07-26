import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import axios from 'axios';

@Injectable()
export class GithubIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async handleCallback(code: string, userId: string): Promise<void> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials are not configured.');
    }

    // 1. Exchange code for access token
    let tokenData: any;
    try {
      const tokenRes = await axios.post(
        'https://github.com/login/oauth/access_token',
        { client_id: clientId, client_secret: clientSecret, code },
        { headers: { Accept: 'application/json' } },
      );
      tokenData = tokenRes.data;
    } catch {
      throw new BadRequestException('Failed to exchange code with GitHub');
    }

    if (tokenData.error) {
      throw new BadRequestException(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token as string;
    const scopes = tokenData.scope as string;

    // 2. Get GitHub user profile
    let githubProfile: any;
    try {
      const profileRes = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      githubProfile = profileRes.data;
    } catch {
      throw new BadRequestException('Failed to fetch GitHub profile');
    }

    // 3. Prevent duplicate linking to a different user
    const existingConnection = await this.prisma.gitHubConnection.findFirst({
      where: { githubUserId: githubProfile.id.toString() },
    });

    if (existingConnection && existingConnection.userId !== userId) {
      throw new BadRequestException(
        'This GitHub account is already linked to another Bamblu account.',
      );
    }

    // 4. Encrypt the access token before storing
    const encryptedToken = this.crypto.encrypt(accessToken);

    // 5. Upsert GitHub connection
    await this.prisma.gitHubConnection.upsert({
      where: { userId },
      update: {
        githubUserId: githubProfile.id.toString(),
        username: githubProfile.login,
        accessToken: encryptedToken,
        scopes,
        updatedAt: new Date(),
      },
      create: {
        userId,
        githubUserId: githubProfile.id.toString(),
        username: githubProfile.login,
        accessToken: encryptedToken,
        scopes,
      },
    });
  }

  /** Fetches a user with their GitHub connections and CF handle for routing decisions. */
  async getUserWithConnections(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        codeforcesHandle: true,
        githubConnections: { select: { id: true } },
      },
    });
  }
}
