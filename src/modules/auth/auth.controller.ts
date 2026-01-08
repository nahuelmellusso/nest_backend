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
import { AuthGuard } from "../../guards/auth.guard";
import { SignInValidationPipe } from "./pipes/SignInValidationPipe.pipe";
import { TypedEventEmitter } from "src/event-emitter/typed-event-emitter.class";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { Response } from "express";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
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

  @Post("/register")
  async create(@Body() createUserDto: CreateUserDto) {
    this.eventEmitter.emit("user.welcome", {
      name: createUserDto.name,
      email: createUserDto.email,
    });

    this.eventEmitter.emit("user.verify-email", {
      name: createUserDto.name,
      email: createUserDto.email,
    });
    return await this.userService.create(createUserDto);
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
