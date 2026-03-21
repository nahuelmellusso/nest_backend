import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Player } from "@/modules/players/player.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";

@Table({
  tableName: "player_stats",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class PlayerStat extends Model<PlayerStat> {
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

  @ForeignKey(() => Player)
  @Column({ field: "player_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare playerId: number;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Column({ field: "matches_played", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare matchesPlayed: number;

  @Column({ field: "matches_started", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare matchesStarted: number;

  @Column({ field: "minutes_played", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare minutesPlayed: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare goals: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare assists: number;

  @Column({ field: "yellow_cards", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare yellowCards: number;

  @Column({ field: "red_cards", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare redCards: number;

  @Column({ field: "own_goals", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare ownGoals: number;

  @Column({
    field: "clean_sheets",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare cleanSheets: number;

  @BelongsTo(() => Season)
  declare season: Season;

  @BelongsTo(() => Stage)
  declare stage: Stage;

  @BelongsTo(() => Team)
  declare team: Team;

  @BelongsTo(() => Player)
  declare player: Player;
}
