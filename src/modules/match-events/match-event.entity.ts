import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { MatchEventPeriod } from "@/enums/match-event-period.enum";
import { MatchEventType } from "@/enums/match-event-type.enum";
import { Match } from "@/modules/matches/match.entity";
import { Player } from "@/modules/players/player.entity";
import { Team } from "@/modules/teams/team.entity";

@Table({
  tableName: "match_events",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class MatchEvent extends Model<MatchEvent> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Match)
  @Column({ field: "match_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare matchId: number;

  @ForeignKey(() => Team)
  @Column({ field: "team_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare teamId: number;

  @ForeignKey(() => Player)
  @Column({
    field: "player_id",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare playerId: number | null;

  @ForeignKey(() => Player)
  @Column({
    field: "related_player_id",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare relatedPlayerId: number | null;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Column({ type: DataType.ENUM(...Object.values(MatchEventType)), allowNull: false })
  declare type: MatchEventType;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare minute: number;

  @Column({
    field: "extra_minute",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare extraMinute: number | null;

  @Column({ type: DataType.ENUM(...Object.values(MatchEventPeriod)), allowNull: false })
  declare period: MatchEventPeriod;

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: null })
  declare description: string | null;

  @BelongsTo(() => Match)
  declare match: Match;

  @BelongsTo(() => Team)
  declare team: Team;

  @BelongsTo(() => Player, "playerId")
  declare player: Player | null;

  @BelongsTo(() => Player, "relatedPlayerId")
  declare relatedPlayer: Player | null;
}
