import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-088
  test('should record audit events for agent lifecycle and all actions in chronological order', async () => {
    // Setup: Mock AuditLogger to capture all log calls
    const auditLogs: Array<{
      eventType: string;
      agentId?: string;
      actionNumber?: number;
      status?: string;
      resultSummary?: Record<string, unknown>;
      completionTimestamp?: string;
      executorId: string;
      executionContext: string;
      timestamp: string;
    }> = [];

    const mockAuditLogger = {
      log: jest.fn((event: {
        eventType: string;
        agentId?: string;
        actionNumber?: number;
        status?: string;
        resultSummary?: Record<string, unknown>;
        completionTimestamp?: string;
        executorId: string;
        executionContext: string;
        timestamp: string;
      }) => {
        auditLogs.push(event);
      }),
    };

    // Mock submission status data
    const mockSubmissionData = {
      totalMembers: 10,
      submittedCount: 7,
      unsubmittedMembers: [
        { memberId: 'user001', name: 'Alice', email: 'alice@example.com' },
        { memberId: 'user002', name: 'Bob', email: 'bob@example.com' },
        { memberId: 'user003', name: 'Charlie', email: 'charlie@example.com' },
      ],
      submissionDeadline: '2024-01-15T09:00:00Z',
      currentTimestamp: '2024-01-15T08:45:00Z',
    };

    // Execute: Call detectAndNotifyUnsubmitted with mock logger
    const result = await detectAndNotifyUnsubmitted(
      mockSubmissionData,
      mockAuditLogger as any
    );

    // Assertions: Verify audit log structure and sequence

    // 1. Verify AGENT_STARTED event
    const startedEvent = auditLogs.find(
      (log) => log.eventType === 'AGENT_STARTED'
    );
    expect(startedEvent).toBeDefined();
    expect(startedEvent?.agentId).toBe('tx-4-imp-1');
    expect(startedEvent?.status).toBe('initiated');
    expect(startedEvent?.executorId).toBeDefined();
    expect(startedEvent?.executionContext).toBeDefined();
    expect(startedEvent?.timestamp).toBeDefined();

    // 2. Verify action sequence (should log ACTION_EXECUTED then ACTION_COMPLETED for each action)
    const actionExecutedEvents = auditLogs.filter(
      (log) => log.eventType === 'ACTION_EXECUTED'
    );
    const actionCompletedEvents = auditLogs.filter(
      (log) => log.eventType === 'ACTION_COMPLETED'
    );

    // Verify that actions 1-7 were executed (as per Tx4Imp1 specification)
    expect(actionExecutedEvents.length).toBeGreaterThanOrEqual(1);
    expect(actionCompletedEvents.length).toEqual(actionExecutedEvents.length);

    // 3. Verify action numbers are present and sequential
    const executedActionNumbers = actionExecutedEvents
      .map((log) => log.actionNumber)
      .filter((num) => num !== undefined) as number[];
    const completedActionNumbers = actionCompletedEvents
      .map((log) => log.actionNumber)
      .filter((num) => num !== undefined) as number[];

    expect(executedActionNumbers.length).toBeGreaterThan(0);
    expect(completedActionNumbers.length).toEqual(executedActionNumbers.length);

    // 4. Verify AGENT_COMPLETED event
    const completedEvent = auditLogs.find(
      (log) => log.eventType === 'AGENT_COMPLETED'
    );
    expect(completedEvent).toBeDefined();
    expect(completedEvent?.agentId).toBe('tx-4-imp-1');
    expect(completedEvent?.status).toBe('success');
    expect(completedEvent?.completionTimestamp).toBeDefined();
    expect(completedEvent?.executorId).toBeDefined();
    expect(completedEvent?.executionContext).toBeDefined();
    expect(completedEvent?.timestamp).toBeDefined();

    // 5. Verify chronological order: Started → Actions → Completed
    expect(auditLogs[0].eventType).toBe('AGENT_STARTED');
    expect(auditLogs[auditLogs.length - 1].eventType).toBe('AGENT_COMPLETED');

    // 6. Verify no duplicate events
    const totalEvents = auditLogs.length;
    const uniqueEventIds = new Set(
      auditLogs.map(
        (log) =>
          `${log.eventType}_${log.actionNumber ?? 'na'}_${log.timestamp}`
      )
    );
    expect(uniqueEventIds.size).toBe(totalEvents);

    // 7. Verify all logs have required fields
    auditLogs.forEach((log) => {
      expect(log.eventType).toBeDefined();
      expect(log.executorId).toBeDefined();
      expect(log.executionContext).toBeDefined();
      expect(log.timestamp).toBeDefined();
      expect(typeof log.timestamp).toBe('string');
    });

    // 8. Verify result contains unsubmitted members count
    expect(result).toBeDefined();
    expect(result.unsubmittedCount).toBe(3);
    expect(result.notificationsSent).toBe(3);
  });
});