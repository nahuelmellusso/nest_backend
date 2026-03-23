import { NotificationChannel } from "@/enums/notification-channel.enum";
import { NotificationType } from "@/enums/notification-type.enum";

export type NotificationRecipient = {
  userId: number;
  tenantId: number;
  email?: string | null;
  name?: string | null;
};

export type NotificationTemplate = {
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  data?: Record<string, unknown> | null;
  channels: NotificationChannel[];
  email?: {
    subject: string;
    template: string;
    context: Record<string, unknown>;
  } | null;
};

export type NotificationDispatchCommand = {
  type: NotificationType;
  recipients: NotificationRecipient[];
  payload?: Record<string, unknown>;
};
