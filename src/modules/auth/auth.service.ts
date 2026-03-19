import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { SignInDto } from "./dto/sign-in.dto";
import { ConfigService } from "@nestjs/config";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";

@Injectable()
export class AuthService extends TenantScopedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.usersService.findByEmail(signInDto.email, true);
    const isMatch = await bcrypt.compare(signInDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tenantId = this.getCurrentTenantId();

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      const tenantIdFromContext = this.getCurrentTenantId();

      if (payload.tenantId !== tenantIdFromContext) {
        return false;
      }

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        return false;
      }

      await this.usersService.markEmailVerified(user.id);

      return true;
    } catch {
      return false;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      const tenantIdFromContext = this.getCurrentTenantId();

      if (payload.tenantId !== tenantIdFromContext) {
        return false;
      }

      const user = await this.usersService.findById(payload.sub, true);

      if (!user) {
        return false;
      }

      user.password = await this.usersService.hashPassword(newPassword);
      await user.save();

      return true;
    } catch {
      return false;
    }
  }
}
