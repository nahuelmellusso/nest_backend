import { Injectable } from "@nestjs/common";
import { NotificationChannel as NotificationChannelEnum } from "@/enums/notification-channel.enum";
import { EmailService } from "@/modules/email/email.service";
import { NotificationChannel } from "./notification-channel.interface";
import { NotificationRecipient, NotificationTemplate } from "../types/notification.types";

@Injectable()
export class EmailNotificationChannel implements NotificationChannel {
  readonly channel = NotificationChannelEnum.EMAIL;

  constructor(private readonly emailService: EmailService) {}

  async send(recipient: NotificationRecipient, template: NotificationTemplate): Promise<void> {
    if (!recipient.email || !template.email) {
      return;
    }

    await this.emailService.sendTemplate({
      to: recipient.email,
      subject: template.email.subject,
      template: template.email.template,
      context: template.email.context,
    });
  }
}
