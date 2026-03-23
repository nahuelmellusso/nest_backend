import { NotificationChannel as NotificationChannelEnum } from "@/enums/notification-channel.enum";
import { NotificationRecipient, NotificationTemplate } from "../types/notification.types";

export interface NotificationChannel {
  readonly channel: NotificationChannelEnum;
  send(recipient: NotificationRecipient, template: NotificationTemplate): Promise<void>;
}
