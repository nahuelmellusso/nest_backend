import { NotificationChannel } from "@/enums/notification-channel.enum";
import { NotificationType } from "@/enums/notification-type.enum";
import { NotificationDispatcher } from "./notification-dispatcher.service";
import { NotificationTemplateResolver } from "./notification-template.resolver";

describe("NotificationDispatcher", () => {
  const templateResolver = {
    resolve: jest.fn(),
  } as unknown as jest.Mocked<NotificationTemplateResolver>;

  const emailChannel = {
    channel: NotificationChannel.EMAIL,
    send: jest.fn(),
  };

  const inAppChannel = {
    channel: NotificationChannel.IN_APP,
    send: jest.fn(),
  };

  let dispatcher: NotificationDispatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    dispatcher = new NotificationDispatcher(templateResolver, [
      emailChannel as any,
      inAppChannel as any,
    ]);
  });

  it("should dispatch a notification to all resolved channels", async () => {
    templateResolver.resolve.mockReturnValue({
      type: NotificationType.USER_REGISTERED,
      title: "Welcome aboard",
      body: "Your account was created successfully.",
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      email: {
        subject: "Welcome",
        template: "./welcome",
        context: { name: "Nahuel" },
      },
    } as any);

    await dispatcher.dispatch({
      type: NotificationType.USER_REGISTERED,
      recipients: [
        {
          userId: 1,
          tenantId: 10,
          email: "nahuel@example.com",
          name: "Nahuel",
        },
      ],
      payload: { tenantName: "Championship App" },
    });

    expect(templateResolver.resolve).toHaveBeenCalledWith(
      NotificationType.USER_REGISTERED,
      {
        userId: 1,
        tenantId: 10,
        email: "nahuel@example.com",
        name: "Nahuel",
      },
      { tenantName: "Championship App" },
    );
    expect(inAppChannel.send).toHaveBeenCalledTimes(1);
    expect(emailChannel.send).toHaveBeenCalledTimes(1);
  });
});
