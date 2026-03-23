import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  AllowNull,
  Unique,
  HasMany,
} from "sequelize-typescript";
import { SportType } from "@/enums/sport-type.enum";
import { SportStatus } from "@/enums/sport-status.enum";
import { Tournament } from "@/modules/tournaments/tournament.entity";

@Table({
  tableName: "sports",
  timestamps: true,
  underscored: true,
})
export class Sport extends Model<Sport> {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  declare name: string;

  @AllowNull(false)
  @Unique
  @Column({
    type: DataType.STRING(120),
  })
  declare slug: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(SportType)),
  })
  declare type: SportType;

  @AllowNull(false)
  @Default(SportStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(SportStatus)),
  })
  declare status: SportStatus;

  @HasMany(() => Tournament)
  declare tournaments: Tournament[];
}
