import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  AllowNull,
  Unique,
  HasMany,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { TournamentType } from "@/enums/tournament-type.enum";
import { Season } from "@/modules/seasons/season.entity";
import { Sport } from "@/modules/sports/sport.entity";

@Table({
  tableName: "tournaments",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Tournament extends Model<Tournament> {
  @HasMany(() => Season)
  declare seasons: Season[];

  @ForeignKey(() => Sport)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    field: "sport_id",
  })
  declare sportId: number | null;

  @BelongsTo(() => Sport)
  declare sport: Sport;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    field: "tenant_id",
  })
  declare tenantId: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(120),
  })
  declare name: string;

  @AllowNull(false)
  @Unique
  @Column({
    type: DataType.STRING(140),
  })
  declare slug: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(TournamentType)),
  })
  declare type: TournamentType;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(2),
  })
  declare country: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  image: string | null;

  @AllowNull(false)
  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
  })
  declare isActive: boolean;
}
