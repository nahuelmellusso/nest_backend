import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async sendTemplate(payload: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, unknown>;
  }) {
    await this.mailerService.sendMail(payload);
  }

  async welcomeEmail(data: { name: string; email: string }) {
    const { email, name } = data;

    const subject = `Welcome to Company: ${name}`;

    await this.sendTemplate({
      to: email,
      subject,
      template: "./welcome",
      context: {
        name,
      },
    });
  }

  async forgotPasswordEmail(data: { name: string; email: string; link: string }) {
    const { name, email, link } = data;

    const subject = `Company: Reset Password`;

    await this.sendTemplate({
      to: email,
      subject,
      template: "./forgot-password",
      context: {
        link,
        name,
      },
    });
  }

  async verifyEmail(data: { name: string; email: string }) {
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

    await this.sendTemplate({
      to: email,
      subject,
      template: "./verify-email",
      context: {
        link,
        name,
      },
    });
  }

  async forgotPassword(data: { name: string; email: string; lang: string }) {
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

    await this.sendTemplate({
      to: email,
      subject,
      template: "./forgot-password",
      context: {
        link,
        name,
      },
    });
  }
}
