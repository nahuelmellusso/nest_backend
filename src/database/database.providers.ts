import { Sequelize } from 'sequelize-typescript';
import { User } from '../modules/users/user.entity';
import { ConfigService } from '@nestjs/config';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async (configService: ConfigService) => {
      const sequelize = new Sequelize({
        dialect: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
      });
      sequelize.addModels([User]);
      await sequelize.sync();
      return sequelize;
    },
    inject: [ConfigService],
  },
];
