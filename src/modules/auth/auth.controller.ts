import {
  Body,
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { AuthGuard } from "@/guards/auth.guard";
import { TypedEventEmitter } from "@/event-emitter/typed-event-emitter.class";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { Response } from "express";
import { UsersService } from "../users/users.service";
import { RegistrationService } from "@/modules/auth/registration.service";
import { RegisterOwnerDto } from "@/modules/auth/dto/register-owner.dto";
import { RegisterTenantUserDto } from "@/modules/auth/dto/register-tenant-user.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private readonly registrationService: RegistrationService,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  async signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.signIn(signInDto);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { success: true };
  }

  @Post("register-owner")
  async registerOwner(
    @Body() registerOwnerDto: RegisterOwnerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registrationService.registerOwner(registerOwnerDto);

    this.eventEmitter.emit("user.welcome", {
      name: result.user.name,
      email: result.user.email,
    });

    this.eventEmitter.emit("user.verify-email", {
      name: result.user.name,
      email: result.user.email,
    });

    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Post("register")
  async registerInTenant(
    @Body() registerTenantUserDto: RegisterTenantUserDto,
    @Query("tenantSlug") tenantSlug: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registrationService.registerUserInTenant(
      registerTenantUserDto,
      tenantSlug,
    );

    this.eventEmitter.emit("user.welcome", {
      name: result.user.name,
      email: result.user.email,
    });

    this.eventEmitter.emit("user.verify-email", {
      name: result.user.name,
      email: result.user.email,
    });

    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Get("/me")
  async me(@Request() req) {
    const user = await this.userService.findById(req.user.userId);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      admin: user.isAdmin,
    };
  }

  @Get("verify")
  async verifyEmail(@Query("token") token: string) {
    const isVerified = await this.authService.verifyEmail(token);

    return {
      status: isVerified,
      message: isVerified ? "Email verified successfully" : "Email verification failed",
    };
  }

  @Post("forgot-password")
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Res() res: Response) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (user) {
      this.eventEmitter.emit("user.forgot-password", {
        email: user.email,
        name: user.name,
        lang: forgotPasswordDto.lang,
      });

      return res.status(HttpStatus.OK).json({
        status: "success",
        message: "Password reset email sent successfully",
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: "error",
        message: "Failed to send password reset email",
      });
    }
  }

  @Post("reset-password")
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() res: Response) {
    const result = await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );

    if (result) {
      return res.status(HttpStatus.OK).json({
        status: "success",
        message: "Password reset successfully",
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: "error",
        message: "Password reset failed",
      });
    }
  }
}
