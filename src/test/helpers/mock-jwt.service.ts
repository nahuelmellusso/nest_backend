import { JwtService } from "@nestjs/jwt";

export const mockJwtService = (): jest.Mocked<JwtService> =>
  ({
    signAsync: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  }) as unknown as jest.Mocked<JwtService>;
