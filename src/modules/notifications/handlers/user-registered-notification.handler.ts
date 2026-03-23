import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { NotificationType } from "@/enums/notification-type.enum";
import { EventPayloads } from "@/interface/event-type.interface";
import { NotificationDispatcher } from "../notification-dispatcher.service";

@Injectable()
export class UserRegisteredNotificationHandler {
  constructor(private readonly notificationDispatcher: NotificationDispatcher) {}

  @OnEvent("user.registered")
  async handle(event: EventPayloads["user.registered"]) {
    await this.notificationDispatcher.dispatch({
      type: NotificationType.USER_REGISTERED,
      recipients: [
        {
          userId: event.userId,
          tenantId: event.tenantId,
          email: event.email,
          name: event.name,
        },
      ],
      payload: {
        tenantName: event.tenantName,
      },
    });
  }
}
