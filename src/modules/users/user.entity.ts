import { Exclude } from "class-transformer";
import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Default,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from "sequelize-typescript";
import { Notification } from "@/modules/notifications/notification.entity";
import { Tenant } from "@/modules/tenants/tenant.entity";
import { Player } from "@/modules/players/player.entity";

@Table({
  tableName: "users",
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ["email"],
    },
  ],
  defaultScope: {
    attributes: { exclude: ["password"] },
  },
})
export class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  @Exclude()
  id: number;

  @ForeignKey(() => Tenant)
  @Column({
    field: "tenant_id",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  tenantId: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: true,
    },
  })
  name: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  })
  email: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: true,
    },
  })
  @Exclude()
  password: string;

  @Default(false)
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  isAdmin: boolean;

  @Default(false)
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  isEmailVerified: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  avatarFilename: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  primaryPosition: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  secondaryPosition: string | null;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  updatedAt: Date;

  @DeletedAt
  @Column({
    type: DataType.DATE,
  })
  deletedAt: Date;

  @HasMany(() => Notification)
  notifications: Notification[];
}
