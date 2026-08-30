import * as cron from 'node-cron';

interface SendReminderNotificationRequest {
  userId: string;
  userName: string;
  platform: 'slack' | 'teams';
}

interface SendReminderNotificationResponse {
  success: boolean;
  messageId: string;
  platform: 'slack' | 'teams';
  timestamp: string;
  deliveryStatus: 'sent' | 'queued' | 'failed';
}

interface ScheduleNotificationRequest {
  scheduleTime: string;
  timezone: string;
  enabled: boolean;
}

interface ScheduleNotificationResponse {
  success: boolean;
  scheduleId: string;
  nextExecutionTime: string;
  status: 'scheduled' | 'active' | 'inactive';
}

interface GetDeliveryStatusRequest {
  messageId: string;
  platform: 'slack' | 'teams';
}

interface DeliveryStatusInfo {
  messageId: string;
  platform: 'slack' | 'teams';
  status: 'sent' | 'failed' | 'pending' | 'queued';
  attempts: number;
  lastAttemptTime: string;
  nextRetryTime?: string;
  errorMessage?: string;
}

interface NotificationServiceAdapterConfig {
  slackBotToken: string;
  slackSigningSecret: string;
  teamsWebhookUrl: string;
  notificationScheduleTime: string;
  notificationTimezone: string;
  slackChannelId: string;
  teamsChannelId: string;
  notificationServiceEnabled: boolean;
}

interface NotificationServiceAdapter {
  sendReminderNotification(request: SendReminderNotificationRequest): Promise<SendReminderNotificationResponse>;
  scheduleNotification(request: ScheduleNotificationRequest): Promise<ScheduleNotificationResponse>;
  getDeliveryStatus(request: GetDeliveryStatusRequest): Promise<DeliveryStatusInfo>;
}

interface PendingNotification {
  messageId: string;
  platform: 'slack' | 'teams';
  userId: string;
  userName: string;
  createdAt: string;
  attempts: number;
  nextRetryTime: string;
  lastError?: string;
}

const RETRY_INTERVALS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];
const MAX_RETRIES = 3;

function loadConfigFromEnvironment(): NotificationServiceAdapterConfig {
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_SIGNING_SECRET',
    'TEAMS_WEBHOOK_URL',
    'NOTIFICATION_SCHEDULE_TIME',
    'NOTIFICATION_TIMEZONE',
    'SLACK_CHANNEL_ID',
    'TEAMS_CHANNEL_ID',
    'NOTIFICATION_SERVICE_ENABLED',
  ];

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    slackBotToken: process.env.SLACK_BOT_TOKEN!,
    slackSigningSecret: process.env.SLACK_SIGNING_SECRET!,
    teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL!,
    notificationScheduleTime: process.env.NOTIFICATION_SCHEDULE_TIME!,
    notificationTimezone: process.env.NOTIFICATION_TIMEZONE!,
    slackChannelId: process.env.SLACK_CHANNEL_ID!,
    teamsChannelId: process.env.TEAMS_CHANNEL_ID!,
    notificationServiceEnabled: process.env.NOTIFICATION_SERVICE_ENABLED === 'true',
  };
}

function createNotificationServiceAdapter(config: NotificationServiceAdapterConfig): NotificationServiceAdapter {
  const pendingNotifications: Map<string, PendingNotification> = new Map();
  const deliveryStatusMap: Map<string, DeliveryStatusInfo> = new Map();
  let scheduledJob: cron.ScheduledTask | null = null;

  async function sendSlackMessage(
    channelId: string,
    userId: string,
    userName: string,
    messageId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const message = `Hi ${userName}, please remember to submit your daily report. Thank you!`;

    const payload = {
      channel: channelId,
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Hi <@${userId}>, please remember to submit your daily report. Thank you!`,
          },
        },
      ],
    };

    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.slackBotToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!data.ok) {
        return { success: false, error: data.error || 'Unknown Slack API error' };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async function sendTeamsMessage(
    channelId: string,
    userId: string,
    userName: string,
  ): Promise<{ success: boolean; error?: string }> {
    const payload = {
      @type: 'MessageCard',
      @context: 'https://schema.org/extensions',
      summary: 'Daily Report Reminder',
      themeColor: '0078D4',
      sections: [
        {
          activityTitle: 'Daily Report Reminder',
          activitySubtitle: `Hello ${userName}`,
          text: 'Please remember to submit your daily report. Thank you!',
          potentialAction: [
            {
              @type: 'OpenUri',
              name: 'Submit Report',
              targets: [
                {
                  os: 'default',
                  uri: 'https://example.com/reports',
                },
              ],
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(config.teamsWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Teams API error: ${response.status} - ${errorText}` };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async function sendWithRetry(
    request: SendReminderNotificationRequest,
    messageId: string,
    attempt: number = 0,
  ): Promise<SendReminderNotificationResponse> {
    const sendFunction = request.platform === 'slack' ? sendSlackMessage : sendTeamsMessage;

    const channelId = request.platform === 'slack' ? config.slackChannelId : config.teamsChannelId;

    const result = await sendFunction(channelId, request.userId, request.userName, messageId);

    if (result.success) {
      const statusInfo: DeliveryStatusInfo = {
        messageId,
        platform: request.platform,
        status: 'sent',
        attempts: attempt + 1,
        lastAttemptTime: new Date().toISOString(),
      };
      deliveryStatusMap.set(messageId, statusInfo);
      pendingNotifications.delete(messageId);

      return {
        success: true,
        messageId,
        platform: request.platform,
        timestamp: new Date().toISOString(),
        deliveryStatus: 'sent',
      };
    }

    if (attempt < MAX_RETRIES) {
      const nextRetryTime = new Date(Date.now() + RETRY_INTERVALS[attempt]);
      const pendingNotification: PendingNotification = {
        messageId,
        platform: request.platform,
        userId: request.userId,
        userName: request.userName,
        createdAt: new Date().toISOString(),
        attempts: attempt + 1,
        nextRetryTime: nextRetryTime.toISOString(),
        lastError: result.error,
      };

      pendingNotifications.set(messageId, pendingNotification);

      const statusInfo: DeliveryStatusInfo = {
        messageId,
        platform: request.platform,
        status: 'queued',
        attempts: attempt + 1,
        lastAttemptTime: new Date().toISOString(),
        nextRetryTime: nextRetryTime.toISOString(),
        errorMessage: result.error,
      };
      deliveryStatusMap.set(messageId, statusInfo);

      setTimeout(() => {
        sendWithRetry(request, messageId, attempt + 1).catch((error) => {
          console.error(`Final retry failed for message ${messageId}:`, error);
          const adminAlert = {
            messageId,
            platform: request.platform,
            userId: request.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          };
          console.error('ADMIN ALERT:', adminAlert);
        });
      }, RETRY_INTERVALS[attempt]);

      return {
        success: false,
        messageId,
        platform: request.platform,
        timestamp: new Date().toISOString(),
        deliveryStatus: 'queued',
      };
    }

    const finalStatusInfo: DeliveryStatusInfo = {
      messageId,
      platform: request.platform,
      status: 'failed',
      attempts: attempt + 1,
      lastAttemptTime: new Date().toISOString(),
      errorMessage: result.error,
    };
    deliveryStatusMap.set(messageId, finalStatusInfo);
    pendingNotifications.delete(messageId);

    const adminAlert = {
      messageId,
      platform: request.platform,
      userId: request.userId,
      userName: request.userName,
      attempts: attempt + 1,
      error: result.error,
      timestamp: new Date().toISOString(),
    };
    console.error('ADMIN ALERT - Max retries exceeded:', adminAlert);

    throw new Error(
      `Failed to send notification after ${MAX_RETRIES} retries. Last error: ${result.error}`,
    );
  }

  async function sendReminderNotification(
    request: SendReminderNotificationRequest,
  ): Promise<SendReminderNotificationResponse> {
    if (!config.notificationServiceEnabled) {
      throw new Error('Notification service is disabled');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return sendWithRetry(request, messageId, 0);
  }

  async function scheduleNotification(
    request: ScheduleNotificationRequest,
  ): Promise<ScheduleNotificationResponse> {
    if (scheduledJob) {
      scheduledJob.stop();
    }

    const scheduleId = `schedule_${Date.now()}`;

    if (!request.enabled) {
      return {
        success: true,
        scheduleId,
        nextExecutionTime: 'N/A',
        status: 'inactive',
      };
    }

    const [hours, minutes] = request.scheduleTime.split(':').map(Number);

    const cronExpression = `${minutes} ${hours} * * *`;

    try {
      scheduledJob = cron.schedule(
        cronExpression,
        async () => {
          console.log(`Executing scheduled notification at ${new Date().toISOString()}`);
        },
        {
          timezone: request.timezone,
        },
      );

      const nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);
      if (nextDate <= new Date()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      return {
        success: true,
        scheduleId,
        nextExecutionTime: nextDate.toISOString(),
        status: 'scheduled',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to schedule notification: ${errorMessage}`);
    }
  }

  async function getDeliveryStatus(request: GetDeliveryStatusRequest): Promise<DeliveryStatusInfo> {
    const status = deliveryStatusMap.get(request.messageId);

    if (!status) {
      throw new Error(`Delivery status not found for message ID: ${request.messageId}`);
    }

    return status;
  }

  return {
    sendReminderNotification,
    scheduleNotification,
    getDeliveryStatus,
  };
}

export {
  NotificationServiceAdapter,
  NotificationServiceAdapterConfig,
  SendReminderNotificationRequest,
  SendReminderNotificationResponse,
  ScheduleNotificationRequest,
  ScheduleNotificationResponse,
  GetDeliveryStatusRequest,
  DeliveryStatusInfo,
  createNotificationServiceAdapter,
  loadConfigFromEnvironment,
};
