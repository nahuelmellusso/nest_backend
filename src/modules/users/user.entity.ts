import { Exclude } from 'class-transformer';
import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Unique,
  Default,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'users', // Especificar el nombre de la tabla
  timestamps: true, // Habilitar timestamps para createdAt y updatedAt
  paranoid: true, // Habilitar soft deletes
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },
  ],
})
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  @Exclude()
  id: number; // ID autoincremental

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: true, // No permitir valores vacíos
    },
  })
  name: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      isEmail: true, // Valida que el valor sea un correo electrónico
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
  deletedAt: Date; // Columna para soft delete
}
