import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EmailService } from "@/modules/email/email.service";
import { EventPayloads } from "@/interface/event-type.interface";

@Injectable()
export class UserRegisteredEmailHandler {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent("user.registered")
  async handle(event: EventPayloads["user.registered"]) {
    await this.emailService.welcomeEmail({
      name: event.name,
      email: event.email,
    });

    await this.emailService.verifyEmail({
      name: event.name,
      email: event.email,
    });
  }
}
