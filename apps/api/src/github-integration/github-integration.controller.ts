import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GithubIntegrationService } from './github-integration.service';
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

function getWebUrl(req?: Request): string {
  if (process.env.WEB_URL) return process.env.WEB_URL;
  if (req) {
    const origin = req.get('origin') || req.get('referer');
    if (origin) {
      try {
        const u = new URL(origin);
        return u.origin;
      } catch {}
    }
  }
  return 'https://monoserver-nmp0.onrender.com';
}

@Controller('github-integration')
export class GithubIntegrationController {
  constructor(
    private readonly githubService: GithubIntegrationService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Initiates GitHub OAuth for account linking (separate from login).
   * Requires the user to already be authenticated via JWT cookie.
   */
  @Get('connect')
  @UseGuards(JwtAuthGuard)
  async connect(@Res() res: Response) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.API_URL}/api/github-integration/callback`;
    const scope = 'public_repo,read:user,user:email';

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    res.redirect(url);
  }

  /**
   * GitHub OAuth callback for account linking.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const webUrl = getWebUrl(req);

    if (!code) {
      throw new BadRequestException('No authorization code provided');
    }

    // Read JWT from cookie
    const token = req.cookies?.['auth_token'];
    if (!token) {
      return res.redirect(`${webUrl}/login?error=session_expired`);
    }

    // Verify JWT using NestJS JwtService
    let payload: { sub: string; email: string; provider: string };
    try {
      payload = this.jwtService.verify(token, { secret: JWT_SECRET });
    } catch {
      return res.redirect(`${webUrl}/login?error=session_expired`);
    }

    const userId = payload.sub;

    try {
      await this.githubService.handleCallback(code, userId);
    } catch (err: any) {
      console.error('[github-integration/callback] error:', err.message);
      return res.redirect(`${webUrl}/onboarding?error=github_failed`);
    }

    // After GitHub connect, check if the user also has a CF handle
    const user = await this.githubService.getUserWithConnections(userId);
    const hasCf = !!(user as any)?.codeforcesHandle;

    const targetPath = hasCf
      ? '/dashboard'
      : '/onboarding?success=github_connected';

    const callbackUrl = new URL('/api/auth/callback', webUrl);
    callbackUrl.searchParams.set('token', token);
    callbackUrl.searchParams.set('destination', targetPath);

    return res.redirect(callbackUrl.toString());
  }
}
