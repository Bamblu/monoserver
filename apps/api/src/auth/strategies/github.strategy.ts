import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder',
      callbackURL: `${process.env.API_URL}/api/auth/github/callback`,
      scope: ['public_repo', 'read:user', 'user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    const { id, displayName, username, emails, photos } = profile;
    const user = {
      provider: 'github',
      providerAccountId: id.toString(),
      email: emails && emails.length > 0 ? emails[0].value : `${id}@github.placeholder.com`,
      name: displayName || username,
      picture: photos && photos.length > 0 ? photos[0].value : null,
      username: username,
      accessToken,
    };
    done(null, user);
  }
}
