import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from "sequelize-typescript";
import { MatchStatus } from "@/enums/match-status.enum";
import { MatchEvent } from "@/modules/match-events/match-event.entity";
import { MatchLineup } from "@/modules/match-lineups/match-lineup.entity";
import { Round } from "@/modules/rounds/round.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";

@Table({
  tableName: "matches",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Match extends Model<Match> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Season)
  @Column({ field: "season_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare seasonId: number;

  @ForeignKey(() => Stage)
  @Column({ field: "stage_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare stageId: number;

  @ForeignKey(() => Round)
  @Column({ field: "round_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare roundId: number;

  @ForeignKey(() => Team)
  @Column({ field: "home_team_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare homeTeamId: number;

  @ForeignKey(() => Team)
  @Column({ field: "away_team_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare awayTeamId: number;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Column({ type: DataType.STRING(180), allowNull: true })
  declare stadium: string | null;

  @Column({ field: "match_date", type: DataType.DATE, allowNull: false })
  declare matchDate: Date;

  @Default(MatchStatus.SCHEDULED)
  @Column({ type: DataType.ENUM(...Object.values(MatchStatus)), allowNull: false })
  declare status: MatchStatus;

  @Column({ field: "home_score", type: DataType.INTEGER, allowNull: true, defaultValue: null })
  declare homeScore: number | null;

  @Column({ field: "away_score", type: DataType.INTEGER, allowNull: true, defaultValue: null })
  declare awayScore: number | null;

  @Column({
    field: "home_penalty_score",
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
  })
  declare homePenaltyScore: number | null;

  @Column({
    field: "away_penalty_score",
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
  })
  declare awayPenaltyScore: number | null;

  @Default(false)
  @Column({ field: "extra_time_played", type: DataType.BOOLEAN, allowNull: false })
  declare extraTimePlayed: boolean;

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: null })
  declare notes: string | null;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: null })
  declare settings: Record<string, unknown> | null;

  @Default(true)
  @Column({ field: "is_active", type: DataType.BOOLEAN, allowNull: false })
  declare isActive: boolean;

  @BelongsTo(() => Season)
  declare season: Season;

  @BelongsTo(() => Stage)
  declare stage: Stage;

  @BelongsTo(() => Round)
  declare round: Round;

  @BelongsTo(() => Team, "homeTeamId")
  declare homeTeam: Team;

  @BelongsTo(() => Team, "awayTeamId")
  declare awayTeam: Team;

  @HasMany(() => MatchEvent)
  declare events: MatchEvent[];

  @HasMany(() => MatchLineup)
  declare lineups: MatchLineup[];
}
