import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';
import { type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

// Mock types
interface UnsubmittedUser {
  userId: string;
  email: string;
}

interface NotificationMessage {
  recipientIds: string[];
  messageType: string;
  scheduledTime: string;
}

interface ExecutionResult {
  actionExecuted: string;
  notificationsSent: number;
  failedRecipients: string[];
}

interface AuditLogEntry {
  action: string;
  unsubmittedCount: number;
  status: string;
  timestamp: string;
}

interface DailyReportContext {
  reports: Array<{
    userId: string;
    submitted: boolean;
    email: string;
  }>;
  auditLog: AuditLogEntry[];
  sendNotification: (message: NotificationMessage) => Promise<void>;
  notificationLog: Array<{ recipientIds: string[]; messageType: string; sentAt: string }>;
}

describe('notification-delivery', () => {
  // SCEN-025
  test('should send unsubmitted reminders to 2 unsubmitted users out of 10 and log audit entry', async () => {
    // Setup: Initialize daily report system stub with test data
    const unsubmittedUsers: UnsubmittedUser[] = [
      { userId: 'user-09', email: 'user09@example.com' },
      { userId: 'user-10', email: 'user10@example.com' },
    ];

    const allUsers = [
      { userId: 'user-01', email: 'user01@example.com', submitted: true },
      { userId: 'user-02', email: 'user02@example.com', submitted: true },
      { userId: 'user-03', email: 'user03@example.com', submitted: true },
      { userId: 'user-04', email: 'user04@example.com', submitted: true },
      { userId: 'user-05', email: 'user05@example.com', submitted: true },
      { userId: 'user-06', email: 'user06@example.com', submitted: true },
      { userId: 'user-07', email: 'user07@example.com', submitted: true },
      { userId: 'user-08', email: 'user08@example.com', submitted: true },
      { userId: 'user-09', email: 'user09@example.com', submitted: false },
      { userId: 'user-10', email: 'user10@example.com', submitted: false },
    ];

    const auditLog: AuditLogEntry[] = [];
    const notificationLog: Array<{ recipientIds: string[]; messageType: string; sentAt: string }> = [];

    const context: DailyReportContext = {
      reports: allUsers,
      auditLog,
      sendNotification: async (message: NotificationMessage) => {
        notificationLog.push({
          recipientIds: message.recipientIds,
          messageType: message.messageType,
          sentAt: new Date().toISOString(),
        });
      },
      notificationLog,
    };

    // Create mock AI client stub for Action 2
    const mockAiClient: Tx1Imp1AiClient = {
      executeAction02: async (unsubmittedUserIds: string[]): Promise<NotificationMessage> => {
        return {
          recipientIds: unsubmittedUserIds,
          messageType: 'DAILY_REPORT_OVERDUE',
          scheduledTime: new Date('2024-01-15T07:00:00Z').toISOString(),
        };
      },
    } as unknown as Tx1Imp1AiClient;

    // Execute the function
    const result = await sendUnsubmittedReminder(unsubmittedUsers, context, mockAiClient);

    // Verify Action 02 execution result
    expect(result).toEqual({
      actionExecuted: 'action-02',
      notificationsSent: 2,
      failedRecipients: [],
    });

    // Verify notification log contains exactly 2 entries with correct recipients
    expect(notificationLog).toHaveLength(1);
    expect(notificationLog[0].recipientIds).toEqual(['user-09', 'user-10']);
    expect(notificationLog[0].messageType).toBe('DAILY_REPORT_OVERDUE');

    // Verify audit log entry
    expect(auditLog).toHaveLength(1);
    expect(auditLog[0].action).toBe('Action 02実行');
    expect(auditLog[0].unsubmittedCount).toBe(2);
    expect(auditLog[0].status).toBe('通知送信完了');
    expect(typeof auditLog[0].timestamp).toBe('string');

    // Verify that only unsubmitted users received notifications, not all 10 users
    const notifiedUserIds = notificationLog[0].recipientIds;
    expect(notifiedUserIds).toContain('user-09');
    expect(notifiedUserIds).toContain('user-10');
    expect(notifiedUserIds.length).toBe(2);
  });
});