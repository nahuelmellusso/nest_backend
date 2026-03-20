import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
  HasMany,
} from "sequelize-typescript";
import { StageType } from "@/enums/stage-type.enum";
import { Season } from "@/modules/seasons/season.entity";
import { Round } from "@/modules/rounds/round.entity";
import { Match } from "@/modules/matches/match.entity";

@Table({
  tableName: "stages",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Stage extends Model<Stage> {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Season)
  @Column({
    field: "season_id",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare seasonId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    field: "tenant_id",
  })
  declare tenantId: number;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(StageType)),
    allowNull: false,
  })
  declare type: StageType;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    field: "order_index",
  })
  declare orderIndex: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: null,
  })
  declare settings: Record<string, unknown> | null;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "is_active",
  })
  declare isActive: boolean;

  @BelongsTo(() => Season)
  declare season: Season;
}
