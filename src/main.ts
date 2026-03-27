import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Nodejs TUT Api')
    .setDescription('API documentation for Nodejs TUT project')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Access API docs at http://localhost:3000/api-docs

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
