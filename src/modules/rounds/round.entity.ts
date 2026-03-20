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
import { RoundStatus } from "@/enums/round-status.enum";
import { Stage } from "@/modules/stages/stage.entity";
import { Match } from "@/modules/matches/match.entity";

@Table({
  tableName: "rounds",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Round extends Model<Round> {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Stage)
  @Column({
    field: "stage_id",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare stageId: number;

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
    field: "round_number",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare roundNumber: number;

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

  @Default(RoundStatus.SCHEDULED)
  @Column({
    type: DataType.ENUM(...Object.values(RoundStatus)),
    allowNull: false,
  })
  declare status: RoundStatus;

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

  @BelongsTo(() => Stage)
  declare stage: Stage;
}
