import { Module } from "@nestjs/common";
import * as path from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AcceptLanguageResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import { EmailModule } from "./modules/email/email.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypedEventEmitterModule } from "./event-emitter/typed-event-emitter.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SequelizeModule, SequelizeModuleOptions } from "@nestjs/sequelize";

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: path.join(__dirname, "/lang/"),
        watch: true,
      },
      resolvers: [{ use: QueryResolver, options: ["lang"] }, AcceptLanguageResolver],
    }),
    EmailModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): SequelizeModuleOptions => ({
        dialect: "mysql",
        host: config.get("DB_HOST"),
        port: Number(config.get("DB_PORT")) || 3306,
        username: config.get("DB_USER"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_NAME"),
        autoLoadModels: true,
        synchronize: false,
      }),
    }),
    EventEmitterModule.forRoot(),
    TypedEventEmitterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
