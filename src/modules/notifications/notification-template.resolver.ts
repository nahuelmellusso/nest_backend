import { Injectable } from "@nestjs/common";
import { NotificationChannel } from "@/enums/notification-channel.enum";
import { NotificationType } from "@/enums/notification-type.enum";
import { NotificationRecipient, NotificationTemplate } from "./types/notification.types";

@Injectable()
export class NotificationTemplateResolver {
  resolve(
    type: NotificationType,
    recipient: NotificationRecipient,
    payload: Record<string, unknown> = {},
  ): NotificationTemplate {
    switch (type) {
      case NotificationType.USER_REGISTERED: {
        const tenantName = String(payload.tenantName ?? "your tenant");
        const recipientName = recipient.name ?? "there";

        return {
          type,
          title: "Welcome aboard",
          body: `Your account was created successfully in ${tenantName}.`,
          link: null,
          data: {
            tenantName,
          },
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          email: {
            subject: `Welcome to ${tenantName}`,
            template: "./welcome",
            context: {
              name: recipientName,
              tenantName,
            },
          },
        };
      }
      default:
        throw new Error(`Notification template not implemented for type: ${type}`);
    }
  }
}
