import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

// Mock para el repositorio de usuarios
const userRepositoryMock = {
  create: jest.fn((createUserDto: CreateUserDto) => ({
    id: Math.floor(Math.random() * 1000) + 1, // Simulación de un ID generado automáticamente
    ...createUserDto,
  })),
  findAll: jest.fn(() => []),
  findByPk: jest.fn((id: number) => ({
    id,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed_password',
    is_admin: false,
  })),
  findOne: jest.fn((options: any) => ({
    id: 1,
    name: 'Test User',
    email: options.where.email,
    password: 'hashed_password',
    is_admin: false,
  })),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'USER_REPOSITORY',
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test2@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      };

      // Act
      const createdUser = await service.create(createUserDto);

      // Assert
      expect(createdUser).toBeDefined();
      expect(createdUser.name).toBe(createUserDto.name);
      expect(createdUser.email).toBe(createUserDto.email);
      expect(createdUser.isAdmin).toBe(false);
      expect(createdUser.password).toBeUndefined(); // Comprobando que la contraseña no se devuelva

      // Verificar que el método create del repositorio haya sido llamado correctamente
      expect(userRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining(createUserDto));
    });

    // Agrega más pruebas según sea necesario para otros métodos del servicio
  });
});
