import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { UsersService } from './users/users.service';

dotenv.config({ path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`) });


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });
  app.setGlobalPrefix('api/v1');

  const userService=app.get<UsersService>(UsersService)
  // app.useGlobalGuards(new BannedUserGuard(userService))

  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE)
    .setDescription(process.env.SWAGGER_DESCRIPTION)
    .setVersion(process.env.SWAGGER_VERSION)
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(process.env.SWAGGER_PREFIX, app, documentFactory);

  await app.listen(Number(process.env.APP_PORT));
}
bootstrap();
