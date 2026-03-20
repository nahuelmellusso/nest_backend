import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { TournamentRegistrationStatus } from "@/enums/tournament-registration-status.enum";
import { Player } from "@/modules/players/player.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Team } from "@/modules/teams/team.entity";
import { Tournament } from "@/modules/tournaments/tournament.entity";

@Table({
  tableName: "tournament_registrations",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class TournamentRegistration extends Model<TournamentRegistration> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Player)
  @Column({ field: "player_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare playerId: number;

  @ForeignKey(() => Tournament)
  @Column({ field: "tournament_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tournamentId: number;

  @ForeignKey(() => Season)
  @Column({ field: "season_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare seasonId: number;

  @ForeignKey(() => Team)
  @Column({
    field: "team_id",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare teamId: number | null;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Default(TournamentRegistrationStatus.PENDING)
  @Column({ type: DataType.ENUM(...Object.values(TournamentRegistrationStatus)), allowNull: false })
  declare status: TournamentRegistrationStatus;

  @Column({
    field: "registered_at",
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare registeredAt: Date;

  @Column({
    field: "jersey_number",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare jerseyNumber: number | null;

  @Column({ type: DataType.STRING(80), allowNull: true, defaultValue: null })
  declare position: string | null;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: null })
  declare metadata: Record<string, unknown> | null;

  @Default(true)
  @Column({ field: "is_active", type: DataType.BOOLEAN, allowNull: false })
  declare isActive: boolean;

  @BelongsTo(() => Player)
  declare player: Player;

  @BelongsTo(() => Tournament)
  declare tournament: Tournament;

  @BelongsTo(() => Season)
  declare season: Season;

  @BelongsTo(() => Team)
  declare team: Team | null;
}
