import { UsersService } from "@/modules/users/users.service";

export const mockUsersService = (): jest.Mocked<UsersService> =>
  ({
    findByEmailInTenant: jest.fn(),
    createUser: jest.fn(),
  }) as unknown as jest.Mocked<UsersService>;
