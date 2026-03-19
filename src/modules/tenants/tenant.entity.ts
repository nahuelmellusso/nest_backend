import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import { TenantDomains } from "@/modules/tenant-domains/tenant-domains.entity";

@Table({
  tableName: "tenants",
  paranoid: true,
})
export class Tenant extends Model<Tenant> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    allowNull: false,
    defaultValue: "active",
    type: DataType.STRING(30),
  })
  status: string;

  @HasMany(() => TenantDomains)
  declare domains: TenantDomains[];
}
