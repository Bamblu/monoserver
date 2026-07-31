import { Controller, Get, Req, Res, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GithubAuthGuard } from './github-auth.guard';
import { CryptoService } from '../crypto/crypto.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
const IS_PROD = process.env.NODE_ENV === 'production';

// Cookie options for fallback direct API cookie setting
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: (IS_PROD ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function getWebUrl(req?: Request): string {
  if (process.env.WEB_URL) return process.env.WEB_URL;
  if (req) {
    const origin = req.get('origin') || req.get('referer');
    if (origin) {
      try {
        const u = new URL(origin);
        return u.origin;
      } catch { }
    }
  }
  return 'https://monoserver-nmp0.onrender.com';
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) { }

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

    // Set cookie on API response (fallback)
    res.cookie('auth_token', jwt, COOKIE_OPTIONS);

    const targetPath = this.authService.isOnboardingComplete(user, provider)
      ? '/dashboard'
      : '/onboarding';

    const webUrl = getWebUrl(req);
    const callbackUrl = new URL('/api/auth/callback', webUrl);
    callbackUrl.searchParams.set('token', jwt);
    callbackUrl.searchParams.set('destination', targetPath);

    console.log('[Google OAuth Callback]', {
      userId: user.id,
      provider,
      isOnboardingComplete: this.authService.isOnboardingComplete(user, provider),
      targetPath,
      redirectingTo: callbackUrl.toString(),
    });

    return res.redirect(callbackUrl.toString());
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
    const webUrl = getWebUrl(req);

    if (state === 'link') {
      // ─── GitHub Account Linking Flow ───────────────────────────────────────
      const token = req.cookies?.['auth_token'];
      if (!token) {
        return res.redirect(`${webUrl}/login?error=session_expired`);
      }

      let payload: any;
      try {
        payload = this.jwtService.verify(token, { secret: JWT_SECRET });
      } catch {
        return res.redirect(`${webUrl}/login?error=session_expired`);
      }

      const userId = payload.sub;

      // Prevent linking if this GitHub account is already connected to another user
      const existingConnection = await this.prisma.gitHubConnection.findFirst({
        where: { githubUserId: githubUser.providerAccountId },
      });

      if (existingConnection && existingConnection.userId !== userId) {
        return res.redirect(`${webUrl}/onboarding?error=duplicate_github`);
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
      const targetPath = hasCf
        ? '/dashboard'
        : '/onboarding?success=github_connected';

      const callbackUrl = new URL('/api/auth/callback', webUrl);
      callbackUrl.searchParams.set('token', token);
      callbackUrl.searchParams.set('destination', targetPath);

      console.log('[GitHub Account Linking Callback]', {
        userId,
        targetPath,
        redirectingTo: callbackUrl.toString(),
      });

      return res.redirect(callbackUrl.toString());
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

      const targetPath = this.authService.isOnboardingComplete(updatedUser, provider)
        ? '/dashboard'
        : '/onboarding';

      const callbackUrl = new URL('/api/auth/callback', webUrl);
      callbackUrl.searchParams.set('token', jwt);
      callbackUrl.searchParams.set('destination', targetPath);

      console.log('[GitHub OAuth Login Callback]', {
        userId: user.id,
        provider,
        isOnboardingComplete: this.authService.isOnboardingComplete(updatedUser, provider),
        targetPath,
        redirectingTo: callbackUrl.toString(),
      });

      return res.redirect(callbackUrl.toString());
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
