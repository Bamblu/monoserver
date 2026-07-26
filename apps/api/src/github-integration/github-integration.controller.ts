import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GithubIntegrationService } from './github-integration.service';
import { Request, Response } from 'express';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

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
    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/api/github-integration/callback`;
    const scope = 'public_repo,read:user,user:email';

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    res.redirect(url);
  }

  /**
   * GitHub OAuth callback for account linking.
   *
   * The browser will still have the auth_token cookie because GitHub
   * redirects back to our API domain (localhost:3001) in development.
   * We read and verify the JWT manually here because @UseGuards(JwtAuthGuard)
   * would reject the request if passport can't find the cookie in this context.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('No authorization code provided');
    }

    // Read JWT from cookie
    const token = req.cookies?.['auth_token'];
    if (!token) {
      return res.redirect(`${WEB_URL}/login?error=session_expired`);
    }

    // Verify JWT using NestJS JwtService
    let payload: { sub: string; email: string; provider: string };
    try {
      payload = this.jwtService.verify(token, { secret: JWT_SECRET });
    } catch {
      return res.redirect(`${WEB_URL}/login?error=session_expired`);
    }

    const userId = payload.sub;

    try {
      await this.githubService.handleCallback(code, userId);
    } catch (err: any) {
      console.error('[github-integration/callback] error:', err.message);
      return res.redirect(`${WEB_URL}/onboarding?error=github_failed`);
    }

    // After GitHub connect, check if the user also has a CF handle
    const user = await this.githubService.getUserWithConnections(userId);
    const hasCf = !!(user as any)?.codeforcesHandle;

    const destination = hasCf
      ? `${WEB_URL}/dashboard`
      : `${WEB_URL}/onboarding?success=github_connected`;

    res.redirect(destination);
  }
}
