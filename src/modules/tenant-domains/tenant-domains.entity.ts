import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Tenant } from "@/modules/tenants/tenant.entity";

@Table({
  tableName: "tenant_domains",
  timestamps: true,
  paranoid: true,
})
export class TenantDomains extends Model<TenantDomains> {
  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "tenant_id",
  })
  declare tenantId: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare domain: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "is_active",
  })
  declare isActive: boolean;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;
}
