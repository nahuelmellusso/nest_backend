import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EmailService } from "@/modules/email/email.service";
import { EventPayloads } from "@/interface/event-type.interface";

@Injectable()
export class UserPasswordResetRequestedHandler {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent("user.password-reset-requested")
  async handle(event: EventPayloads["user.password-reset-requested"]) {
    await this.emailService.forgotPassword({
      name: event.name,
      email: event.email,
      lang: event.lang,
    });
  }
}
