import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

@Get()
getRoot(@Res() res: Response) {
  console.log('WEB_URL =', process.env.WEB_URL);

  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  return res.redirect(webUrl);
}

  @Get('health')
  getHealth(): { status: string; message: string } {
    return this.appService.getHealth();
  }
}
