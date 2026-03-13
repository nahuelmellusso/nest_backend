import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "./email.service";
import { MailerService } from "@nestjs-modules/mailer";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

describe("EmailService", () => {
  let service: EmailService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
