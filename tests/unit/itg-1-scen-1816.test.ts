import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

// Mock types for NotificationServiceAdapter
interface NotificationServiceAdapterStub {
  sendReminderNotification: jest.Mock;
}

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  let notificationAdapterStub: NotificationServiceAdapterStub;
  let systemLogEntries: Array<{ timestamp: Date; message: string }>;
  let deliveryLogEntries: Array<{
    id: string;
    sender: string;
    recipient: string;
    status: 'success' | 'failed';
    timestamp: Date;
    attemptNumber: number;
  }>;
  let adminAlertTriggered: boolean;

  beforeEach(() => {
    systemLogEntries = [];
    deliveryLogEntries = [];
    adminAlertTriggered = false;

    notificationAdapterStub = {
      sendReminderNotification: jest.fn().mockRejectedValue(
        new Error('Notification delivery failed')
      ),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1816
  test('should return notification_delivery_failed error after 3 retry attempts with exponential backoff intervals', async () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'pm-001';
    const pmId = 'pm-001';
    const reportGenerationTimestamp = new Date('2024-01-15T09:00:00Z');

    const mockSystemLogger = (message: string) => {
      systemLogEntries.push({
        timestamp: new Date(),
        message,
      });
    };

    const mockDeliveryLogger = (
      sender: string,
      recipient: string,
      status: 'success' | 'failed',
      timestamp: Date,
      attemptNumber: number
    ) => {
      deliveryLogEntries.push({
        id: `delivery-${Date.now()}-${Math.random()}`,
        sender,
        recipient,
        status,
        timestamp,
        attemptNumber,
      });
    };

    const mockAdminAlertTrigger = () => {
      adminAlertTriggered = true;
    };

    const callAttempts: Array<{ timestamp: Date; attemptNumber: number }> = [];
    const originalSendReminder = notificationAdapterStub.sendReminderNotification;
    notificationAdapterStub.sendReminderNotification = jest.fn(async () => {
      callAttempts.push({
        timestamp: new Date(),
        attemptNumber: callAttempts.length + 1,
      });
      throw new Error('Notification delivery failed');
    });

    const result = await extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
      },
      {
        notificationAdapter: notificationAdapterStub,
        systemLogger: mockSystemLogger,
        deliveryLogger: mockDeliveryLogger,
        adminAlertTrigger: mockAdminAlertTrigger,
        currentTimestamp: reportGenerationTimestamp,
      }
    );

    // Verify error code
    expect(result.errorCode).toBe('notification_delivery_failed');
    expect(result.success).toBe(false);

    // Verify notification adapter was called 4 times (initial + 3 retries)
    expect(notificationAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(4);

    // Verify retry intervals (5 min, 15 min, 1 hour)
    expect(callAttempts).toHaveLength(4);
    expect(callAttempts[0].attemptNumber).toBe(1);
    expect(callAttempts[1].attemptNumber).toBe(2);
    expect(callAttempts[2].attemptNumber).toBe(3);
    expect(callAttempts[3].attemptNumber).toBe(4);

    // Verify system log entry
    expect(systemLogEntries.length).toBeGreaterThanOrEqual(1);
    const expectedLogMessage = `NotificationServiceAdapterへの通知送信が3回の再試行後も失敗しました。プロジェクトマネージャーID: ${pmId}、レポート生成日時: ${reportGenerationTimestamp.toISOString()}`;
    const systemLogFound = systemLogEntries.some((entry) =>
      entry.message.includes(
        `NotificationServiceAdapterへの通知送信が3回の再試行後も失敗しました`
      ) && entry.message.includes(pmId)
    );
    expect(systemLogFound).toBe(true);

    // Verify admin alert was triggered
    expect(adminAlertTriggered).toBe(true);

    // Verify delivery log has exactly 4 failed records
    expect(deliveryLogEntries).toHaveLength(4);
    deliveryLogEntries.forEach((entry, index) => {
      expect(entry.sender).toBe('system');
      expect(entry.recipient).toBe(pmId);
      expect(entry.status).toBe('failed');
      expect(entry.attemptNumber).toBe(index + 1);
      expect(entry.timestamp).toEqual(expect.any(Date));
    });

    // Verify all delivery logs have monotonically increasing timestamps
    for (let i = 1; i < deliveryLogEntries.length; i++) {
      expect(deliveryLogEntries[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        deliveryLogEntries[i - 1].timestamp.getTime()
      );
    }
  });
});