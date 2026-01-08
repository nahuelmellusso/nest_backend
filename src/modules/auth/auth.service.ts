import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { SignInDto } from "./dto/sign-in.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /*  async signIn(signInDto: SignInDto) {
    const user = await this.usersService.findByEmail(signInDto.email);
    const isMatch = await bcrypt.compare(signInDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }*/

  async signIn(signInDto: SignInDto) {
    const user = await this.usersService.findByEmail(signInDto.email);
    const isMatch = await bcrypt.compare(signInDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.email };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken }; // mejor camelCase
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });
      const user = await this.usersService.findByEmail(payload.email);

      if (user) {
        user.isEmailVerified = true;
        await this.usersService.update(user.id, user);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        return false;
      }

      user.password = await this.usersService.hashPassword(newPassword);
      await user.save();
      return true;
    } catch (e) {
      return false;
    }
  }
}
