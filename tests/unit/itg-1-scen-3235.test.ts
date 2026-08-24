import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11AgentInput, Tx11AgentOutput, Tx11AgentExecutionContext } from '../../src/agents/tx-11-imp-1/orchestrator';

// Mock NotificationServiceAdapter
const mockNotificationServiceAdapter = {
  sendReminderNotification: jest.fn(),
  scheduleNotification: jest.fn(),
  getDeliveryStatus: jest.fn(),
};

// Mock Tx11Imp1AiClient for dependency injection
const createMockAiClient = () => ({
  executeAction01: jest.fn(),
  executeAction02: jest.fn(),
  executeAction03: jest.fn(),
  executeAction04: jest.fn(),
  executeAction05: jest.fn(),
  executeAction06: jest.fn(),
  executeAction07: jest.fn(),
});

// Mock database for audit logs and notification delivery logs
const mockDatabase = {
  notificationDeliveryLogs: [] as Array<{
    timestamp: Date;
    memberId: string;
    notificationType: string;
    deliveryStatus: string;
  }>,
  auditLogs: [] as Array<{
    action: string;
    executedAt: Date;
    targetMembers: number;
    status: string;
  }>,
};

describe('Tx11 Agent - Autonomous notification to unsubmitted members', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase.notificationDeliveryLogs = [];
    mockDatabase.auditLogs = [];

    // Setup mock AI client to return unsubmitted member list
    const mockAiClient = createMockAiClient();
    mockAiClient.executeAction02.mockResolvedValue({
      unsubmittedMemberIds: ['M001', 'M003', 'M007'],
      actionStatus: 'READY_TO_SEND_REMINDER',
    });

    // Setup mock NotificationServiceAdapter
    mockNotificationServiceAdapter.sendReminderNotification.mockImplementation(
      (memberId: string) => {
        // Record delivery log
        mockDatabase.notificationDeliveryLogs.push({
          timestamp: new Date('2024-01-15T08:45:00Z'),
          memberId,
          notificationType: 'DAILY_REPORT_REMINDER',
          deliveryStatus: 'SUCCESS',
        });
        return Promise.resolve({ success: true, deliveryStatus: 'SUCCESS' });
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3235
  test('should autonomously send reminder notifications to unsubmitted members and record audit logs', async () => {
    // Setup input parameters
    const executionTimestamp = new Date('2024-01-15T08:45:00Z');
    const teamId = 'TEAM-DEV-001';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@example.com';

    const input: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    // Create mock AI client with proper implementation
    const mockAiClient = createMockAiClient();

    // Action 01: Get submission status
    mockAiClient.executeAction01.mockResolvedValue({
      submittedMemberIds: ['M002', 'M004', 'M005', 'M006', 'M008', 'M009', 'M010'],
      unsubmittedMemberIds: ['M001', 'M003', 'M007'],
      totalMembers: 10,
      submittedCount: 7,
    });

    // Action 02: Prepare reminder notifications
    mockAiClient.executeAction02.mockResolvedValue({
      unsubmittedMemberIds: ['M001', 'M003', 'M007'],
      reminderMessages: [
        { memberId: 'M001', message: 'Please submit your daily report' },
        { memberId: 'M003', message: 'Please submit your daily report' },
        { memberId: 'M007', message: 'Please submit your daily report' },
      ],
      actionStatus: 'READY_TO_SEND_REMINDER',
    });

    // Action 03: Send reminders via adapter
    mockAiClient.executeAction03.mockImplementation(async () => {
      const unsubmittedIds = ['M001', 'M003', 'M007'];
      for (const memberId of unsubmittedIds) {
        const result = await mockNotificationServiceAdapter.sendReminderNotification(
          memberId,
          'DAILY_REPORT_REMINDER',
          'NORMAL'
        );
        if (!result.success) {
          throw new Error(`Failed to send reminder to ${memberId}`);
        }
      }
      return {
        notificationsSent: 3,
        deliveryStatus: 'SUCCESS',
        actionStatus: 'COMPLETED',
      };
    });

    // Action 04: Record audit log
    mockAiClient.executeAction04.mockResolvedValue({
      auditLogId: 'AUDIT-20240115-001',
      action: 'SEND_REMINDER_NOTIFICATION',
      executedAt: new Date('2024-01-15T08:45:00Z'),
      targetMembers: 3,
      status: 'COMPLETED',
    });

    // Mock the orchestrator to use our AI client
    const output = await runTx11Imp1Agent(input, mockAiClient);

    // Verify: Action 02 was called to prepare reminders
    expect(mockAiClient.executeAction02).toHaveBeenCalled();

    // Verify: Action 03 was called (implicit via executeAction03)
    expect(mockAiClient.executeAction03).toHaveBeenCalled();

    // Verify: NotificationServiceAdapter.sendReminderNotification was called exactly 3 times
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);

    // Verify: Each call has correct parameters
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      1,
      'M001',
      'DAILY_REPORT_REMINDER',
      'NORMAL'
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      2,
      'M003',
      'DAILY_REPORT_REMINDER',
      'NORMAL'
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      3,
      'M007',
      'DAILY_REPORT_REMINDER',
      'NORMAL'
    );

    // Verify: Notification delivery logs contain 3 records
    expect(mockDatabase.notificationDeliveryLogs).toHaveLength(3);

    // Verify: Each log record has correct structure
    mockDatabase.notificationDeliveryLogs.forEach((log, index) => {
      expect(log.timestamp).toEqual(new Date('2024-01-15T08:45:00Z'));
      expect(['M001', 'M003', 'M007']).toContain(log.memberId);
      expect(log.notificationType).toBe('DAILY_REPORT_REMINDER');
      expect(log.deliveryStatus).toBe('SUCCESS');
    });

    // Verify: Audit log was recorded
    expect(mockAiClient.executeAction04).toHaveBeenCalled();

    // Verify: Output structure matches Tx11AgentOutput
    expect(output).toHaveProperty('submissionStatus');
    expect(output).toHaveProperty('prioritizedIssues');
    expect(output).toHaveProperty('notificationsSent');
    expect(output).toHaveProperty('summaryEmailSent');

    // Verify: Submission status reflects unsubmitted members
    expect(output.submissionStatus.totalMembers).toBe(10);
    expect(output.submissionStatus.submittedCount).toBe(7);
    expect(output.submissionStatus.unsubmittedMembers).toEqual(
      expect.arrayContaining(['M001', 'M003', 'M007'])
    );

    // Verify: Notifications sent count
    expect(output.notificationsSent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: 'M001', status: 'SUCCESS' }),
        expect.objectContaining({ memberId: 'M003', status: 'SUCCESS' }),
        expect.objectContaining({ memberId: 'M007', status: 'SUCCESS' }),
      ])
    );

    // Verify: No duplicate sends occurred
    const memberIdsSent = mockDatabase.notificationDeliveryLogs.map((log) => log.memberId);
    const uniqueMemberIds = new Set(memberIdsSent);
    expect(uniqueMemberIds.size).toBe(3);

    // Verify: Action 04 recorded the audit event with correct structure
    const auditLogCall = mockAiClient.executeAction04.mock.results[0];
    expect(auditLogCall.value).toMatchObject({
      action: 'SEND_REMINDER_NOTIFICATION',
      targetMembers: 3,
      status: 'COMPLETED',
    });
  });
});