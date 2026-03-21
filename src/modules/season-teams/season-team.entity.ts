import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { SeasonTeamStatus } from "@/enums/season-team-status.enum";
import { Season } from "@/modules/seasons/season.entity";
import { Team } from "@/modules/teams/team.entity";

@Table({
  tableName: "season_teams",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class SeasonTeam extends Model<SeasonTeam> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Season)
  @Column({ field: "season_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare seasonId: number;

  @ForeignKey(() => Team)
  @Column({ field: "team_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare teamId: number;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Default(SeasonTeamStatus.CONFIRMED)
  @Column({ type: DataType.ENUM(...Object.values(SeasonTeamStatus)), allowNull: false })
  declare status: SeasonTeamStatus;

  @Column({
    field: "registered_at",
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare registeredAt: Date;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true, defaultValue: null })
  declare seed: number | null;

  @Column({ field: "group_name", type: DataType.STRING(80), allowNull: true, defaultValue: null })
  declare groupName: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true, defaultValue: null })
  declare notes: string | null;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: null })
  declare metadata: Record<string, unknown> | null;

  @Default(true)
  @Column({ field: "is_active", type: DataType.BOOLEAN, allowNull: false })
  declare isActive: boolean;

  @BelongsTo(() => Season)
  declare season: Season;

  @BelongsTo(() => Team)
  declare team: Team;
}
