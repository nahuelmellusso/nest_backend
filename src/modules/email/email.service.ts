import { EventPayloads } from "./../../interface/event-type.interface";
import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent("user.welcome")
  async welcomeEmail(data: EventPayloads["user.welcome"]) {
    const { email, name } = data;

    const subject = `Welcome to Company: ${name}`;

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: "./welcome",
      context: {
        name,
      },
    });
  }

  @OnEvent("user.reset-password")
  async forgotPasswordEmail(data: EventPayloads["user.reset-password"]) {
    const { name, email, link } = data;

    const subject = `Company: Reset Password`;

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: "./forgot-password",
      context: {
        link,
        name,
      },
    });
  }

  @OnEvent("user.verify-email")
  async verifyEmail(data: EventPayloads["user.verify-email"]) {
    const { name, email } = data;

    const subject = `Company: Verify Email`;

    const token = this.jwtService.sign(
      { email },
      {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: "1d",
      },
    );

    const link = `${this.configService.get<string>("APP_URL")}/auth/verify?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: "./verify-email",
      context: {
        link: link,
        name,
      },
    });
  }

  @OnEvent("user.forgot-password")
  async forgotPassword(data: EventPayloads["user.forgot-password"]) {
    const { name, email, lang } = data;

    const subject = `Company: Forgot Password`;

    const token = this.jwtService.sign(
      { email },
      {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: "1d",
      },
    );

    const link = `${this.configService.get<string>("FRONT_URL")}/${lang}/auth/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: "./forgot-password",
      context: {
        link: link,
        name: name,
      },
    });
  }
}
