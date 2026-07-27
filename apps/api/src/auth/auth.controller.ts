import { Controller, Get, Req, Res, UseGuards, Post, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GithubAuthGuard } from './github-auth.guard';
import { CryptoService } from '../crypto/crypto.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
const IS_PROD = process.env.NODE_ENV === 'production';

// In production: cookie crosses from Render API to Vercel frontend.
// Must use SameSite=none + Secure=true for cross-site cookie delivery.
// In development: lax is fine (same host, different ports).
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: (IS_PROD ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  // domain: omit — let browser infer from response host
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Google OAuth ──────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { user, provider } = await this.authService.validateOAuthLogin(req.user);
    const jwt = this.authService.generateJwt(user, provider);

    res.cookie('auth_token', jwt, COOKIE_OPTIONS);

    const destination = this.authService.isOnboardingComplete(user, provider)
      ? `${WEB_URL}/dashboard`
      : `${WEB_URL}/onboarding`;

    res.redirect(destination);
  }

  // ─── GitHub OAuth (Unified Login & Account Linking) ───────────────────────

  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubAuth() {
    // GithubAuthGuard initiates GitHub OAuth flow and dynamically forwards state
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const state = req.query.state as string;
    const githubUser = req.user as any;

    if (state === 'link') {
      // ─── GitHub Account Linking Flow ───────────────────────────────────────
      // Read current JWT from cookies to verify authenticated user
      const token = req.cookies?.['auth_token'];
      if (!token) {
        return res.redirect(`${WEB_URL}/login?error=session_expired`);
      }

      let payload: any;
      try {
        payload = this.jwtService.verify(token, { secret: JWT_SECRET });
      } catch {
        return res.redirect(`${WEB_URL}/login?error=session_expired`);
      }

      const userId = payload.sub;

      // Prevent linking if this GitHub account is already connected to another user
      const existingConnection = await this.prisma.gitHubConnection.findFirst({
        where: { githubUserId: githubUser.providerAccountId },
      });

      if (existingConnection && existingConnection.userId !== userId) {
        return res.redirect(`${WEB_URL}/onboarding?error=duplicate_github`);
      }

      // Encrypt the access token for secure DB storage
      const encryptedToken = this.cryptoService.encrypt(githubUser.accessToken);

      // Link/Upsert the GitHub connection
      await this.prisma.gitHubConnection.upsert({
        where: { userId },
        update: {
          githubUserId: githubUser.providerAccountId,
          username: githubUser.username,
          accessToken: encryptedToken,
          scopes: 'public_repo,read:user,user:email',
          updatedAt: new Date(),
        },
        create: {
          userId,
          githubUserId: githubUser.providerAccountId,
          username: githubUser.username,
          accessToken: encryptedToken,
          scopes: 'public_repo,read:user,user:email',
        },
      });

      // Get updated user status for redirect routing
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { githubConnections: true },
      });

      const hasCf = !!updatedUser?.codeforcesHandle;
      const destination = hasCf
        ? `${WEB_URL}/dashboard`
        : `${WEB_URL}/onboarding?success=github_connected`;

      return res.redirect(destination);
    } else {
      // ─── GitHub Authentication (Login) Flow ───────────────────────────────
      const { user, provider } = await this.authService.validateOAuthLogin(githubUser);
      const jwt = this.authService.generateJwt(user, provider);

      res.cookie('auth_token', jwt, COOKIE_OPTIONS);

      // Automatically link/update the GitHubConnection for users logging in via GitHub
      const encryptedToken = this.cryptoService.encrypt(githubUser.accessToken);
      await this.prisma.gitHubConnection.upsert({
        where: { userId: user.id },
        update: {
          githubUserId: githubUser.providerAccountId,
          username: githubUser.username,
          accessToken: encryptedToken,
          scopes: 'public_repo,read:user,user:email',
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          githubUserId: githubUser.providerAccountId,
          username: githubUser.username,
          accessToken: encryptedToken,
          scopes: 'public_repo,read:user,user:email',
        },
      });

      // Query updated user connections for redirection logic
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { githubConnections: true },
      });

      const destination = this.authService.isOnboardingComplete(updatedUser, provider)
        ? `${WEB_URL}/dashboard`
        : `${WEB_URL}/onboarding`;

      return res.redirect(destination);
    }
  }

  // ─── Profile & Session ────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    // Clear with same options used when setting the cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? 'none' : 'lax',
    });
    res.status(200).json({ success: true });
  }
}
