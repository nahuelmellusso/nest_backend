import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { SequelizeModule, SequelizeModuleOptions } from "@nestjs/sequelize";
import { AcceptLanguageResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import * as path from "path";
import { TypedEventEmitterModule } from "./event-emitter/typed-event-emitter.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { EmailModule } from "./modules/email/email.module";
import { UsersModule } from "./modules/users/users.module";
import { MatchEventsModule } from "@/modules/match-events/match-events.module";
import { MatchLineupsModule } from "@/modules/match-lineups/match-lineups.module";
import { MatchesModule } from "@/modules/matches/matches.module";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { PlayersModule } from "@/modules/players/players.module";
import { PlayerStatsModule } from "@/modules/player-stats/player-stats.module";
import { RoundsModule } from "@/modules/rounds/rounds.module";
import { SeasonTeamPlayersModule } from "@/modules/season-team-players/season-team-players.module";
import { SeasonsModule } from "@/modules/seasons/seasons.module";
import { SeasonTeamsModule } from "@/modules/season-teams/season-teams.module";
import { StagesModule } from "@/modules/stages/stages.module";
import { StandingsModule } from "@/modules/standings/standings.module";
import { Team } from "@/modules/teams/team.entity";
import { TeamsModule } from "@/modules/teams/teams.module";
import { TenantDomains } from "@/modules/tenant-domains/tenant-domains.entity";
import { TenantResolverMiddleware } from "@/modules/tenancy/middleware/tenant-resolver.middleware";
import { Tenant } from "@/modules/tenants/tenant.entity";
import { TournamentRegistrationsModule } from "@/modules/tournament-registrations/tournament-registrations.module";
import { TournamentsModule } from "@/modules/tournaments/tournaments.module";

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    SeasonsModule,
    TournamentsModule,
    TeamsModule,
    StagesModule,
    RoundsModule,
    MatchesModule,
    PlayersModule,
    PlayerStatsModule,
    SeasonTeamsModule,
    SeasonTeamPlayersModule,
    TournamentRegistrationsModule,
    MatchEventsModule,
    MatchLineupsModule,
    StandingsModule,
    NotificationsModule,
    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: path.join(__dirname, "lang"),
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
    SequelizeModule.forFeature([Tenant, TenantDomains]),
    EventEmitterModule.forRoot(),
    TypedEventEmitterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantResolverMiddleware)
      .exclude(
        { path: "health", method: RequestMethod.ALL },
        { path: "swagger", method: RequestMethod.ALL },
        { path: "swagger/(.*)", method: RequestMethod.ALL },
      )
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
