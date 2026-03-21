import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from "sequelize-typescript";
import { User } from "@/modules/users/user.entity";
import { PlayerStat } from "@/modules/player-stats/player-stat.entity";
import { TournamentRegistration } from "@/modules/tournament-registrations/tournament-registration.entity";

@Table({
  tableName: "players",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Player extends Model<Player> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ field: "user_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare userId: number;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Column({ field: "first_name", type: DataType.STRING(120), allowNull: false })
  declare firstName: string;

  @Column({ field: "last_name", type: DataType.STRING(120), allowNull: true, defaultValue: null })
  declare lastName: string | null;

  @Column({ field: "full_name", type: DataType.STRING(255), allowNull: false })
  declare fullName: string;

  @Column({ field: "birth_date", type: DataType.DATEONLY, allowNull: true, defaultValue: null })
  declare birthDate: string | null;

  @Column({ type: DataType.STRING(2), allowNull: true, defaultValue: null })
  declare nationality: string | null;

  @Column({ type: DataType.STRING(80), allowNull: true, defaultValue: null })
  declare position: string | null;

  @Column({ field: "photo_url", type: DataType.STRING(255), allowNull: true, defaultValue: null })
  declare photoUrl: string | null;

  @Default(true)
  @Column({ field: "is_active", type: DataType.BOOLEAN, allowNull: false })
  declare isActive: boolean;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: null })
  declare metadata: Record<string, unknown> | null;

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => PlayerStat)
  declare playerStats: PlayerStat[];
}
