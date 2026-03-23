import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { EmailModule } from "@/modules/email/email.module";
import { NotificationDispatcher, NOTIFICATION_CHANNELS } from "./notification-dispatcher.service";
import { Notification } from "./notification.entity";
import { NotificationTemplateResolver } from "./notification-template.resolver";
import { EmailNotificationChannel } from "./channels/email-notification.channel";
import { InAppNotificationChannel } from "./channels/in-app-notification.channel";
import { UserRegisteredNotificationHandler } from "./handlers/user-registered-notification.handler";

@Module({
  imports: [SequelizeModule.forFeature([Notification]), EmailModule],
  providers: [
    NotificationTemplateResolver,
    EmailNotificationChannel,
    InAppNotificationChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (
        emailChannel: EmailNotificationChannel,
        inAppChannel: InAppNotificationChannel,
      ) => [emailChannel, inAppChannel],
      inject: [EmailNotificationChannel, InAppNotificationChannel],
    },
    NotificationDispatcher,
    UserRegisteredNotificationHandler,
  ],
  exports: [NotificationDispatcher],
})
export class NotificationsModule {}
