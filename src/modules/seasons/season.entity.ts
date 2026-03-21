import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { Tournament } from "@/modules/tournaments/tournament.entity";
import { SeasonStatus } from "@/enums/season-status.enum";
import { PlayerStat } from "@/modules/player-stats/player-stat.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Standing } from "@/modules/standings/standing.entity";

@Table({
  tableName: "seasons",
  paranoid: true,
  timestamps: true,
  underscored: true,
})
export class Season extends Model<Season> {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Tournament)
  @Column({
    field: "tournament_id",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare tournamentId: number;

  @Column({
    field: "tenant_id",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare tenantId: number;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare year: number;

  @Column({
    field: "start_date",
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare startDate: string;

  @Column({
    field: "end_date",
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare endDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(SeasonStatus)),
    allowNull: false,
    defaultValue: SeasonStatus.DRAFT,
  })
  declare status: SeasonStatus;

  @BelongsTo(() => Tournament)
  declare tournament: Tournament;

  @HasMany(() => Stage)
  declare stages: Stage[];

  @HasMany(() => Standing)
  declare standings: Standing[];

  @HasMany(() => PlayerStat)
  declare playerStats: PlayerStat[];
}
