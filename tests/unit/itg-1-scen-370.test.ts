import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  // SCEN-370: [normal] 定時リマインド送信機能 - 外部サービス（Slack/Teams）が正常応答した場合、通知配信ステータスとして成功が記録される
  test('should record successful reminder notification delivery when external service responds successfully', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['slack', 'email'] as const;
    
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        statusCode: 200,
        deliveryStatus: 'success' as const,
        userId: 'user-001',
        channel: 'slack',
        sentAt: new Date('2024-01-15T08:30:15Z'),
        externalServiceResponse: {
          ok: true,
          message_ts: '1705318215.000100'
        }
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' })
    };

    const mockNotificationLogRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'log-001',
        userId: 'user-001',
        notificationType: 'reminder',
        deliveryStatus: 'success',
        deliveryTimestamp: new Date('2024-01-15T08:30:15Z'),
        externalServiceResponse: {
          ok: true,
          message_ts: '1705318215.000100'
        }
      }),
      findLatestByUserId: jest.fn().mockResolvedValue({
        id: 'log-001',
        userId: 'user-001',
        notificationType: 'reminder',
        deliveryStatus: 'success',
        deliveryTimestamp: new Date('2024-01-15T08:30:15Z'),
        externalServiceResponse: {
          ok: true,
          message_ts: '1705318215.000100'
        }
      })
    };

    const mockUserRepository = {
      findByTeamId: jest.fn().mockResolvedValue([
        {
          userId: 'user-001',
          userName: 'Engineer-001',
          email: 'engineer001@example.com',
          teamId: 'team-001'
        }
      ])
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels
    };

    const result = await sendDailyReportReminder(input, {
      notificationServiceAdapter: mockNotificationServiceAdapter,
      notificationLogRepository: mockNotificationLogRepository,
      userRepository: mockUserRepository
    });

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    
    expect(result.notificationDetails).toHaveLength(1);
    const notificationDetail = result.notificationDetails[0] as ReminderNotificationDetail;
    expect(notificationDetail.userId).toBe('user-001');
    expect(notificationDetail.status).toBe('sent');
    expect(notificationDetail.sentAt).toEqual(new Date('2024-01-15T08:30:15Z'));
    expect(notificationDetail.errorMessage).toBeUndefined();

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
        channels: notificationChannels,
        remainingMinutes: 30
      })
    );

    expect(mockNotificationLogRepository.create).toHaveBeenCalledTimes(1);
    expect(mockNotificationLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
        notificationType: 'reminder',
        deliveryStatus: 'success'
      })
    );

    const retrievedLog = await mockNotificationLogRepository.findLatestByUserId('user-001');
    expect(retrievedLog.userId).toBe('user-001');
    expect(retrievedLog.notificationType).toBe('reminder');
    expect(retrievedLog.deliveryStatus).toBe('success');
    expect(retrievedLog.externalServiceResponse).toEqual({
      ok: true,
      message_ts: '1705318215.000100'
    });
  });
});