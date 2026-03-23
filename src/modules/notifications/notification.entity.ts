import { Column, DataType, ForeignKey, Model, Table, BelongsTo } from "sequelize-typescript";
import { NotificationType } from "@/enums/notification-type.enum";
import { User } from "@/modules/users/user.entity";

@Table({
  tableName: "notifications",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Notification extends Model<Notification> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ field: "user_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare userId: number;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Column({ type: DataType.ENUM(...Object.values(NotificationType)), allowNull: false })
  declare type: NotificationType;

  @Column({ type: DataType.STRING(160), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare body: string;

  @Column({ type: DataType.STRING(255), allowNull: true, defaultValue: null })
  declare link: string | null;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: null })
  declare data: Record<string, unknown> | null;

  @Column({ field: "read_at", type: DataType.DATE, allowNull: true, defaultValue: null })
  declare readAt: Date | null;

  @BelongsTo(() => User)
  declare user: User;
}
