import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { NotificationChannel as NotificationChannelEnum } from "@/enums/notification-channel.enum";
import { Notification } from "../notification.entity";
import { NotificationChannel } from "./notification-channel.interface";
import { NotificationRecipient, NotificationTemplate } from "../types/notification.types";

@Injectable()
export class InAppNotificationChannel implements NotificationChannel {
  readonly channel = NotificationChannelEnum.IN_APP;

  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {}

  async send(recipient: NotificationRecipient, template: NotificationTemplate): Promise<void> {
    await this.notificationModel.create({
      userId: recipient.userId,
      tenantId: recipient.tenantId,
      type: template.type,
      title: template.title,
      body: template.body,
      link: template.link ?? null,
      data: template.data ?? null,
      readAt: null,
    });
  }
}
