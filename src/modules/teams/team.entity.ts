import { AllowNull, Column, DataType, Default, HasMany, Model, Table } from "sequelize-typescript";
import { PlayerStat } from "@/modules/player-stats/player-stat.entity";
import { Standing } from "@/modules/standings/standing.entity";

@Table({
  tableName: "teams",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Team extends Model<Team> {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    field: "tenant_id",
  })
  declare tenantId: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(140),
  })
  declare name: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(60),
    field: "short_name",
  })
  declare shortName: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(160),
  })
  declare slug: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  declare city: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(2),
  })
  declare country: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: "logo_url",
  })
  declare logoUrl: string | null;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    field: "founded_year",
  })
  declare foundedYear: number | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: "website_url",
  })
  declare websiteUrl: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: null,
  })
  declare metadata: Record<string, unknown> | null;

  @AllowNull(false)
  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    field: "is_active",
  })
  declare isActive: boolean;

  @HasMany(() => Standing)
  declare standings: Standing[];

  @HasMany(() => PlayerStat)
  declare playerStats: PlayerStat[];
}
