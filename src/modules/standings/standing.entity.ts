import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";

@Table({
  tableName: "standings",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Standing extends Model<Standing> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Season)
  @Column({ field: "season_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare seasonId: number;

  @ForeignKey(() => Stage)
  @Column({ field: "stage_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare stageId: number;

  @ForeignKey(() => Team)
  @Column({ field: "team_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare teamId: number;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare played: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare wins: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare draws: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare losses: number;

  @Column({ field: "goals_for", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare goalsFor: number;

  @Column({ field: "goals_against", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare goalsAgainst: number;

  @Column({ field: "goal_difference", type: DataType.INTEGER, allowNull: false })
  declare goalDifference: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare points: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare position: number;

  @Column({
    field: "last_five_form",
    type: DataType.STRING(5),
    allowNull: true,
    defaultValue: null,
  })
  declare lastFiveForm: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true, defaultValue: null })
  declare notes: string | null;

  @BelongsTo(() => Season)
  declare season: Season;

  @BelongsTo(() => Stage)
  declare stage: Stage;

  @BelongsTo(() => Team)
  declare team: Team;
}
