import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentInput, type Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('TX-11 Agent - Idempotent Retry with Notification De-duplication', () => {
  // SCEN-3248
  test('should not duplicate reminder notifications when the same request is retried', async () => {
    // Setup: Initialize test database with member submission status
    const executionTimestamp = new Date('2024-01-15T08:30:00Z');
    const teamId = 'team-dev-001';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@example.com';

    // Mock NotificationServiceAdapter
    const notificationSendLog: Array<{
      memberId: string;
      timestamp: Date;
      status: string;
    }> = [];

    const auditLog: Array<{
      action: string;
      memberId: string;
      timestamp: Date;
      details: string;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(
        async (memberId: string, message: string, deadline: string) => {
          notificationSendLog.push({
            memberId,
            timestamp: executionTimestamp,
            status: 'sent',
          });
          return { status: 'success', deliveryId: `delivery-${memberId}-${Date.now()}` };
        }
      ),
      scheduleNotification: jest.fn(async () => ({ status: 'scheduled' })),
      getDeliveryStatus: jest.fn(async (deliveryId: string) => ({
        status: 'delivered',
      })),
    };

    // Mock past submission status: Member A is unsubmitted
    const memberSubmissionStatus = {
      'member-a': { submitted: false, lastSubmitTime: null },
      'member-b': { submitted: false, lastSubmitTime: null },
      'member-c': { submitted: false, lastSubmitTime: null },
    };

    // Mock database fetch to track which members have already received notifications today
    const notificationHistoryByMember: Map<string, Date> = new Map();

    const input: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    // First execution: send reminder to Member A
    const firstExecutionResult = await runTx11Imp1Agent(input, {
      notificationService: mockNotificationServiceAdapter,
      getUnsubmittedMembers: jest.fn(async () => ['member-a', 'member-b', 'member-c']),
      getSubmissionStatusSummary: jest.fn(async () => ({
        totalMembers: 3,
        submittedCount: 0,
        unsubmittedMembers: ['member-a', 'member-b', 'member-c'],
      })),
      extractIssues: jest.fn(async () => []),
      logAuditEvent: jest.fn(async (event: object) => {
        auditLog.push(event as any);
      }),
      recordNotificationDelivery: jest.fn(async (record: object) => {
        const rec = record as any;
        notificationHistoryByMember.set(rec.memberId, new Date(rec.sentAt));
      }),
      checkNotificationDeduplication: jest.fn(async (memberId: string, timestamp: Date) => {
        const lastNotified = notificationHistoryByMember.get(memberId);
        if (lastNotified && lastNotified.getTime() === timestamp.getTime()) {
          return { isDuplicate: true, lastNotificationTime: lastNotified };
        }
        return { isDuplicate: false, lastNotificationTime: null };
      }),
    } as any);

    // Verify first execution: notification sent once
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);
    expect(notificationSendLog).toHaveLength(3);
    expect(notificationSendLog[0].memberId).toBe('member-a');
    expect(notificationSendLog[0].status).toBe('sent');
    expect(firstExecutionResult.notificationsSent).toHaveLength(3);

    // Verify notification history recorded for Member A at T1
    const memberAFirstNotificationTime = notificationHistoryByMember.get('member-a');
    expect(memberAFirstNotificationTime).toBeDefined();
    expect(memberAFirstNotificationTime?.getTime()).toBe(executionTimestamp.getTime());

    // Clear mock call count for second execution
    mockNotificationServiceAdapter.sendReminderNotification.mockClear();

    // Second execution: retry with same parameters
    const secondExecutionResult = await runTx11Imp1Agent(input, {
      notificationService: mockNotificationServiceAdapter,
      getUnsubmittedMembers: jest.fn(async () => ['member-a', 'member-b', 'member-c']),
      getSubmissionStatusSummary: jest.fn(async () => ({
        totalMembers: 3,
        submittedCount: 0,
        unsubmittedMembers: ['member-a', 'member-b', 'member-c'],
      })),
      extractIssues: jest.fn(async () => []),
      logAuditEvent: jest.fn(async (event: object) => {
        auditLog.push(event as any);
      }),
      recordNotificationDelivery: jest.fn(async (record: object) => {
        const rec = record as any;
        notificationHistoryByMember.set(rec.memberId, new Date(rec.sentAt));
      }),
      checkNotificationDeduplication: jest.fn(async (memberId: string, timestamp: Date) => {
        const lastNotified = notificationHistoryByMember.get(memberId);
        if (lastNotified && lastNotified.getTime() === timestamp.getTime()) {
          return { isDuplicate: true, lastNotificationTime: lastNotified };
        }
        return { isDuplicate: false, lastNotificationTime: null };
      }),
    } as any);

    // Verify second execution: no new notification sent (deduplication active)
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(0);

    // Verify notification delivery log still contains only 1 entry per member
    expect(notificationSendLog).toHaveLength(3);
    expect(
      notificationSendLog.filter((log) => log.memberId === 'member-a')
    ).toHaveLength(1);

    // Verify Member A's timestamp unchanged at T1
    const memberASecondNotificationTime = notificationHistoryByMember.get('member-a');
    expect(memberASecondNotificationTime?.getTime()).toBe(executionTimestamp.getTime());

    // Verify audit log records RETRY_SKIPPED for Member A
    const retrySkippedEvents = auditLog.filter(
      (log) => log.action === 'RETRY_SKIPPED' && log.memberId === 'member-a'
    );
    expect(retrySkippedEvents.length).toBeGreaterThan(0);
    expect(retrySkippedEvents[0].details).toContain('already notified');

    // Verify second execution result shows deduplication status
    expect(secondExecutionResult.executionStatus).toBe('success');
    expect(secondExecutionResult.reminderNotificationsSent).toBe(0);
  });
});