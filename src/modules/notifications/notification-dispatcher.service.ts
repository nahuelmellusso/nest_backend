import { Inject, Injectable } from "@nestjs/common";
import { NotificationChannel as NotificationChannelEnum } from "@/enums/notification-channel.enum";
import { NotificationTemplateResolver } from "./notification-template.resolver";
import { NotificationChannel } from "./channels/notification-channel.interface";
import { NotificationDispatchCommand } from "./types/notification.types";

export const NOTIFICATION_CHANNELS = "NOTIFICATION_CHANNELS";

@Injectable()
export class NotificationDispatcher {
  constructor(
    private readonly templateResolver: NotificationTemplateResolver,
    @Inject(NOTIFICATION_CHANNELS)
    private readonly channels: NotificationChannel[],
  ) {}

  async dispatch(command: NotificationDispatchCommand): Promise<void> {
    for (const recipient of command.recipients) {
      const template = this.templateResolver.resolve(command.type, recipient, command.payload);

      for (const channelName of template.channels) {
        const channel = this.channels.find((candidate) => candidate.channel === channelName);

        if (!channel) {
          continue;
        }

        await channel.send(recipient, template);
      }
    }
  }
}
