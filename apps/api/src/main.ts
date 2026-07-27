import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Set global prefix excluding root route so http://localhost:3001 redirects to web app
  app.setGlobalPrefix('api', { exclude: ['/'] });
  
  // Enable CORS since this is an API
  app.enableCors({
origin: process.env.WEB_URL,
    credentials: true,
  });

  // Enable cookie parser
  app.use(cookieParser());

  const port = process.env.PORT || 3001;
  await app.listen(port);
console.log(`NestJS application is running on port ${port}`);
}
bootstrap();
