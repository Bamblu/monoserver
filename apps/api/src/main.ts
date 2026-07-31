import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix — all routes under /api except root /
  app.setGlobalPrefix('api', { exclude: ['/'] });

  // CORS — allow both configured web origin and any production Vercel deployment
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (server-to-server, curl, OAuth redirects from providers)
      if (!origin) return callback(null, true);

      // If WEB_URL matches
      if (process.env.WEB_URL && origin === process.env.WEB_URL) {
        return callback(null, true);
      }

      // Allow vercel.app domains and configured production origin
      if (origin.endsWith('.vercel.app') || origin === process.env.WEB_URL) {
        return callback(null, true);
      }

      return callback(null, true); // Allow origin in open CORS model for auth API
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Cookie parser — require() for reliable CJS/ESM compat in NestJS
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`NestJS API running on port ${port}`);
  console.log(`  WEB_URL: ${process.env.WEB_URL}`);
  console.log(`  API_URL: ${process.env.API_URL}`);
}
bootstrap();
