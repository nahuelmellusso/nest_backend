import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { SeasonTeamPlayerStatus } from "@/enums/season-team-player-status.enum";
import { Player } from "@/modules/players/player.entity";
import { SeasonTeam } from "@/modules/season-teams/season-team.entity";

@Table({
  tableName: "season_team_players",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class SeasonTeamPlayer extends Model<SeasonTeamPlayer> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => SeasonTeam)
  @Column({ field: "season_team_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare seasonTeamId: number;

  @ForeignKey(() => Player)
  @Column({ field: "player_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare playerId: number;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Column({
    field: "jersey_number",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare jerseyNumber: number | null;

  @Column({ type: DataType.STRING(80), allowNull: true, defaultValue: null })
  declare position: string | null;

  @Default(SeasonTeamPlayerStatus.ACTIVE)
  @Column({ type: DataType.ENUM(...Object.values(SeasonTeamPlayerStatus)), allowNull: false })
  declare status: SeasonTeamPlayerStatus;

  @Column({ field: "joined_at", type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare joinedAt: Date;

  @Column({ field: "left_at", type: DataType.DATE, allowNull: true, defaultValue: null })
  declare leftAt: Date | null;

  @Default(false)
  @Column({ field: "is_captain", type: DataType.BOOLEAN, allowNull: false })
  declare isCaptain: boolean;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: null })
  declare metadata: Record<string, unknown> | null;

  @Default(true)
  @Column({ field: "is_active", type: DataType.BOOLEAN, allowNull: false })
  declare isActive: boolean;

  @BelongsTo(() => SeasonTeam)
  declare seasonTeam: SeasonTeam;

  @BelongsTo(() => Player)
  declare player: Player;
}
