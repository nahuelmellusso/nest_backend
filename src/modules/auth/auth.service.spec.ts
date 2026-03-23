import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { TypedEventEmitter } from "@/event-emitter/typed-event-emitter.class";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";

describe("AuthService", () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    markEmailVerified: jest.fn(),
    hashPassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTypedEventEmitter = {
    emit: jest.fn(),
  };

  const mockTenantContextService = {
    getTenantId: jest.fn(),
    setTenantId: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TypedEventEmitter,
          useValue: mockTypedEventEmitter,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("requestPasswordReset", () => {
    it("should emit a business event when the user exists", async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 7,
        tenantId: 3,
        email: "player@example.com",
        name: "Player One",
      });

      const result = await service.requestPasswordReset("player@example.com", "es");

      expect(result).toBe(true);
      expect(mockTypedEventEmitter.emit).toHaveBeenCalledWith("user.password-reset-requested", {
        userId: 7,
        tenantId: 3,
        email: "player@example.com",
        name: "Player One",
        lang: "es",
      });
    });

    it("should return false when the user does not exist", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset("missing@example.com", "es");

      expect(result).toBe(false);
      expect(mockTypedEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
