import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { databaseProviders } from '../../database/database.providers';

@Module({
  imports: [], // No es necesario importar nada adicional aquí
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'USER_REPOSITORY',
      useValue: User,
    },
    ...databaseProviders, // Incluye los proveedores de la base de datos
  ],
  exports: [UsersService],
})
export class UsersModule {}
