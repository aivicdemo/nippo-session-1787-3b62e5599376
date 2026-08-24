import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import { type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('notification-delivery: generateAndSendSummaryEmail', () => {
  // SCEN-3067
  test('should send admin alert after 3 failed retry attempts by NotificationServiceAdapter', async () => {
    const fixedNow = new Date('2026-01-20T09:00:00Z');
    const firstFailureTime = '2026-01-20T09:00:00Z';
    const secondFailureTime = '2026-01-20T09:05:00Z';
    const thirdFailureTime = '2026-01-20T09:20:00Z';
    const fourthFailureTime = '2026-01-20T10:20:00Z';
    const adminEmail = 'admin@example.com';
    const userId = 'user001';
    const retryCount = 3;

    const mockNotificationLogs: Array<{
      attempt: number;
      userId: string;
      notificationType: string;
      timestamp: string;
      status: string;
    }> = [];

    const mockAdminAlerts: Array<{
      adminEmail: string;
      failedUserId: string;
      retryAttempts: number;
      notificationType: string;
      failureTimestamp: string;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        const attempt = mockNotificationLogs.length + 1;
        if (attempt <= retryCount + 1) {
          mockNotificationLogs.push({
            attempt,
            userId,
            notificationType: 'リマインド通知',
            timestamp: fixedNow.toISOString(),
            status: 'failed',
          });
          const error = new Error('API connection timeout');
          (error as any).code = 'TIMEOUT';
          throw error;
        }
        return { success: true };
      }),
      sendAdminAlert: jest.fn(async (payload: {
        adminEmail: string;
        failedUserId: string;
        retryAttempts: number;
        notificationType: string;
        failureTimestamp: string;
      }) => {
        mockAdminAlerts.push(payload);
        return { alertSent: true };
      }),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2026-01-20',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: userId,
          reporterName: 'Engineer A',
          submittedAt: '2026-01-20T08:45:00Z',
          challenges: ['Database performance issue', 'API integration delay'],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:30',
    };

    let adminAlertTriggered = false;
    let finalLogStatus = '';

    try {
      const output = await generateAndSendSummaryEmail(input, mockNotificationServiceAdapter);
      
      if (mockAdminAlerts.length > 0) {
        adminAlertTriggered = true;
        const alert = mockAdminAlerts[0];
        expect(alert.adminEmail).toBe(adminEmail);
        expect(alert.failedUserId).toBe(userId);
        expect(alert.retryAttempts).toBe(retryCount);
        expect(alert.notificationType).toBe('リマインド通知');
        expect(alert.failureTimestamp).toBeDefined();
      }

      if (mockNotificationLogs.length > 0) {
        const finalLog = mockNotificationLogs[mockNotificationLogs.length - 1];
        finalLogStatus = finalLog.status;
      }
    } catch (error) {
      expect(mockNotificationServiceAdapter.sendAdminAlert).toHaveBeenCalled();
      adminAlertTriggered = true;
    }

    expect(mockNotificationLogs.length).toBeGreaterThanOrEqual(retryCount + 1);
    expect(mockNotificationLogs[0]).toEqual({
      attempt: 1,
      userId,
      notificationType: 'リマインド通知',
      timestamp: firstFailureTime,
      status: 'failed',
    });

    if (mockNotificationLogs.length > 1) {
      expect(mockNotificationLogs[1]).toEqual({
        attempt: 2,
        userId,
        notificationType: 'リマインド通知',
        timestamp: secondFailureTime,
        status: 'failed',
      });
    }

    if (mockNotificationLogs.length > 2) {
      expect(mockNotificationLogs[2]).toEqual({
        attempt: 3,
        userId,
        notificationType: 'リマインド通知',
        timestamp: thirdFailureTime,
        status: 'failed',
      });
    }

    if (mockNotificationLogs.length > 3) {
      expect(mockNotificationLogs[3]).toEqual({
        attempt: 4,
        userId,
        notificationType: 'リマインド通知',
        timestamp: fourthFailureTime,
        status: 'failed',
      });
    }

    expect(mockAdminAlerts.length).toBe(1);
    expect(mockAdminAlerts[0]).toEqual({
      adminEmail: 'admin@example.com',
      failedUserId: 'user001',
      retryAttempts: 3,
      notificationType: 'リマインド通知',
      failureTimestamp: expect.any(String),
    });

    expect(adminAlertTriggered).toBe(true);
  });
});