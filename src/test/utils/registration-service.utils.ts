import { JwtService } from "@nestjs/jwt";
import { RegistrationService } from "@/modules/auth/registration.service";
import { TenantsService } from "@/modules/tenants/tenants.service";
import { UsersService } from "@/modules/users/users.service";
import {
  mockSequelizeTransaction,
  type TransactionMock,
} from "@/test/helpers/mock-sequelize-transaction";

export const createRegistrationServiceTestSetup = (): {
  service: RegistrationService;
  usersService: jest.Mocked<UsersService>;
  tenantsService: jest.Mocked<TenantsService>;
  jwtService: jest.Mocked<JwtService>;
  sequelize: {
    transaction: jest.Mock;
  };
  transactionMock: TransactionMock;
} => {
  const { sequelizeMock, transactionMock } = mockSequelizeTransaction();

  const usersService = {
    findByEmailInTenant: jest.fn(),
    createUser: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;

  const tenantsService = {
    generateUniqueSlug: jest.fn(),
    create: jest.fn(),
    findBySlug: jest.fn(),
  } as unknown as jest.Mocked<TenantsService>;

  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const service = new RegistrationService(
    usersService,
    tenantsService,
    jwtService,
    sequelizeMock as any,
  );

  return {
    service,
    usersService,
    tenantsService,
    jwtService,
    sequelize: sequelizeMock,
    transactionMock,
  };
};
