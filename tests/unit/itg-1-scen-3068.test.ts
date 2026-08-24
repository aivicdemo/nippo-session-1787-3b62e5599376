import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

interface MockNotificationServiceAdapter {
  sendReminderNotification: jest.MockedFunction<any>;
  scheduleNotification: jest.MockedFunction<any>;
  getDeliveryStatus: jest.MockedFunction<any>;
}

interface MockDeliveryLog {
  notificationId: string;
  status: 'success' | 'failure' | 'pending';
  timestamp: string;
}

interface MockDashboardState {
  delayMessageDisplayed: boolean;
}

interface MockInternalQueue {
  queuedNotifications: Array<{
    notificationId: string;
    retryCount: number;
    nextRetryTime: string;
  }>;
}

describe('generateAndSendSummaryEmail - Slack/Teams API malformed response handling', () => {
  let mockAdapter: MockNotificationServiceAdapter;
  let deliveryLog: MockDeliveryLog[];
  let dashboardState: MockDashboardState;
  let internalQueue: MockInternalQueue;

  beforeEach(() => {
    deliveryLog = [];
    dashboardState = { delayMessageDisplayed: false };
    internalQueue = { queuedNotifications: [] };

    mockAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };
  });

  // SCEN-3068
  test('should mark as failure and trigger retry queue when NotificationServiceAdapter returns malformed response with missing status field', async () => {
    const testTeamId = 'team-001';
    const testReportDate = '2024-01-15';
    const testManagerUserId = 'manager-001';
    const testDeadlineTime = '09:00';

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: testTeamId,
      reportDate: testReportDate,
      managerUserId: testManagerUserId,
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Alice',
          submittedAt: '2024-01-15T08:30:00Z',
          challenges: ['Database performance issue', 'API timeout'],
        },
      ],
      unsubmittedMemberIds: ['engineer-002'],
      reportDeadlineTime: testDeadlineTime,
    };

    const malformedResponse = {
      deliveryId: 'dlv-001',
      // Missing required 'status' field
      timestamp: '2024-01-15T08:45:00Z',
    };

    mockAdapter.sendReminderNotification.mockResolvedValueOnce(malformedResponse);

    mockAdapter.scheduleNotification.mockImplementation(
      async ({ notificationId, retrySchedule }) => {
        internalQueue.queuedNotifications.push({
          notificationId,
          retryCount: 0,
          nextRetryTime: retrySchedule[0],
        });
      }
    );

    let capturedDeliveryLog: MockDeliveryLog | null = null;
    let dashboardMessageSet = false;

    const originalFunction = generateAndSendSummaryEmail;
    
    const result: GenerateAndSendSummaryEmailOutput = await originalFunction(
      input,
      mockAdapter as any,
      {
        logDeliveryStatus: (log: MockDeliveryLog) => {
          capturedDeliveryLog = log;
          deliveryLog.push(log);
        },
        setDashboardMessage: (message: string) => {
          if (message.includes('通知送信に遅延が発生しています')) {
            dashboardState.delayMessageDisplayed = true;
            dashboardMessageSet = true;
          }
        },
      }
    );

    expect(mockAdapter.sendReminderNotification).toHaveBeenCalled();

    expect(capturedDeliveryLog).not.toBeNull();
    expect(capturedDeliveryLog?.status).toBe('failure');
    expect(capturedDeliveryLog?.notificationId).toBeDefined();

    expect(dashboardState.delayMessageDisplayed).toBe(true);
    expect(dashboardMessageSet).toBe(true);

    expect(internalQueue.queuedNotifications.length).toBeGreaterThan(0);
    const queuedItem = internalQueue.queuedNotifications[0];
    expect(queuedItem).toBeDefined();
    expect(queuedItem.retryCount).toBe(0);

    expect(mockAdapter.scheduleNotification).toHaveBeenCalled();
    const scheduleCall = mockAdapter.scheduleNotification.mock.calls[0];
    const retrySchedule = scheduleCall[0]?.retrySchedule || [];
    expect(retrySchedule.length).toBeLessThanOrEqual(3);

    expect(result.emailId).toBeDefined();
    expect(result.sentAt).toBeDefined();
    expect(result.recipientEmail).toBeDefined();
  });

  // SCEN-3068 (variant: undefined deliveryStatus field)
  test('should mark as failure and trigger retry queue when deliveryStatus field is undefined', async () => {
    const testTeamId = 'team-002';
    const testReportDate = '2024-01-15';
    const testManagerUserId = 'manager-002';
    const testDeadlineTime = '09:00';

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: testTeamId,
      reportDate: testReportDate,
      managerUserId: testManagerUserId,
      submittedReports: [
        {
          reporterId: 'engineer-003',
          reporterName: 'Bob',
          submittedAt: '2024-01-15T08:35:00Z',
          challenges: ['Network latency'],
        },
      ],
      unsubmittedMemberIds: ['engineer-004', 'engineer-005'],
      reportDeadlineTime: testDeadlineTime,
    };

    const malformedResponse = {
      deliveryId: 'dlv-002',
      status: 'sent',
      deliveryStatus: undefined,
      timestamp: '2024-01-15T08:46:00Z',
    };

    mockAdapter.sendReminderNotification.mockResolvedValueOnce(malformedResponse);

    mockAdapter.scheduleNotification.mockImplementation(
      async ({ notificationId, retrySchedule }) => {
        internalQueue.queuedNotifications.push({
          notificationId,
          retryCount: 0,
          nextRetryTime: retrySchedule[0],
        });
      }
    );

    let capturedDeliveryLog: MockDeliveryLog | null = null;

    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      input,
      mockAdapter as any,
      {
        logDeliveryStatus: (log: MockDeliveryLog) => {
          capturedDeliveryLog = log;
          deliveryLog.push(log);
        },
        setDashboardMessage: (message: string) => {
          if (message.includes('通知送信に遅延が発生しています')) {
            dashboardState.delayMessageDisplayed = true;
          }
        },
      }
    );

    expect(capturedDeliveryLog?.status).toBe('failure');
    expect(capturedDeliveryLog?.status).not.toBe('success');
    expect(capturedDeliveryLog?.status).not.toBe('pending');

    expect(internalQueue.queuedNotifications.length).toBeGreaterThan(0);

    expect(result.emailId).toBeDefined();
  });

  // SCEN-3068 (variant: null response body)
  test('should mark as failure and trigger retry queue when response body is null', async () => {
    const testTeamId = 'team-003';
    const testReportDate = '2024-01-15';
    const testManagerUserId = 'manager-003';

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: testTeamId,
      reportDate: testReportDate,
      managerUserId: testManagerUserId,
      submittedReports: [
        {
          reporterId: 'engineer-006',
          reporterName: 'Charlie',
          submittedAt: '2024-01-15T08:40:00Z',
          challenges: ['Memory leak detected'],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    mockAdapter.sendReminderNotification.mockResolvedValueOnce(null);

    mockAdapter.scheduleNotification.mockImplementation(
      async ({ notificationId, retrySchedule }) => {
        internalQueue.queuedNotifications.push({
          notificationId,
          retryCount: 0,
          nextRetryTime: retrySchedule[0],
        });
      }
    );

    let capturedDeliveryLog: MockDeliveryLog | null = null;

    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      input,
      mockAdapter as any,
      {
        logDeliveryStatus: (log: MockDeliveryLog) => {
          capturedDeliveryLog = log;
          deliveryLog.push(log);
        },
        setDashboardMessage: (message: string) => {
          if (message.includes('通知送信に遅延が発生しています')) {
            dashboardState.delayMessageDisplayed = true;
          }
        },
      }
    );

    expect(capturedDeliveryLog?.status).toBe('failure');

    expect(dashboardState.delayMessageDisplayed).toBe(true);

    expect(internalQueue.queuedNotifications.length).toBeGreaterThan(0);

    expect(result.emailId).toBeDefined();
  });
});