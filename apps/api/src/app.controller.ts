import { Controller, Get, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(@Req() req: Request, @Res() res: Response) {
    const webUrl = process.env.WEB_URL || req.get('origin') || 'https://monoserver-nmp0.onrender.com';
    return res.redirect(webUrl);
  }

  @Get('health')
  getHealth(): { status: string; message: string } {
    return this.appService.getHealth();
  }
}
