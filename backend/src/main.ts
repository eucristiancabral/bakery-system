import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilita o CORS para permitir que o React converse com o NestJS
  app.enableCors({
    origin: '*', // Em produção limitaremos para a URL do seu site, mas em dev liberamos tudo
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();