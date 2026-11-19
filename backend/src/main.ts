import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as dns from 'dns';

// Force IPv4 first to prevent ENETUNREACH on Railway with Nodemailer/MongoDB etc.
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
    // rawBody keeps the unparsed request body available for webhook HMAC verification
    const app = await NestFactory.create(AppModule, { rawBody: true });

    // Security
    app.use(helmet());
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
            exceptionFactory: (errors) => {
                const formattedErrors: Record<string, string> = {};
                errors.forEach((error) => {
                    if (error.constraints) {
                        const messages = Object.values(error.constraints);
                        formattedErrors[error.property] = messages[0];
                    }
                });
                const exception = new BadRequestException({
                    message: 'Validation failed',
                    error: 'Bad Request',
                    statusCode: 400,
                    errors: formattedErrors,
                });
                return exception;
            },
        }),
    );

    // API prefix
    app.setGlobalPrefix('api/v1');

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('Dental Clinic CRM API')
        .setDescription('Comprehensive dental clinic practice management API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🦷 Dental CRM API running on `);
    console.log(`📚 API Docs available.`);
}
bootstrap();
