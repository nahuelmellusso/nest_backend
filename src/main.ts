import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CustomValidationPipe } from "./pipes/validation.pipe";
import * as cookieParser from "cookie-parser";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { VersioningType } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  app.useGlobalPipes(new CustomValidationPipe());
  app.enableCors({
    origin: "http://localhost:5173",
    credentials: true,
  });
  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];
  app.enableCors({
    origin: (origin, callback) => {
      // Permite herramientas como Postman o requests server-to-server
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many requests, please try again later.",
      },
    }),
  );
  app.use(compression());
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });
  app.enableShutdownHooks();

  await app.listen(3030);
}
bootstrap();
