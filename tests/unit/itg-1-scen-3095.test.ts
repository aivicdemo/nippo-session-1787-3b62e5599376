import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent - Rollback on Partial Failure', () => {
  // SCEN-3095
  test('should rollback completed side effects when Action 3 fails during autonomous execution', async () => {
    const executionTimestamp = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');
    const targetTeamIds = ['team-001', 'team-002'];
    const managerUserId = 'manager-001';

    // Database snapshots before execution
    const initialReportCount = 5;
    const initialUnsubmittedCount = 3;
    const initialNotificationLogCount = 0;
    const initialIssueTableCount = 0;
    const initialMeetingMaterialCount = 0;

    // Mock AI Client with controlled behavior
    const mockAiClient: Tx1Imp1AiClient = {
      // Action 1: Get submission status (succeeds)
      getSubmissionStatus: jest.fn().mockResolvedValue({
        submittedCount: initialReportCount,
        unsubmittedMembers: [
          { userId: 'eng-001', userName: 'Engineer 1' },
          { userId: 'eng-002', userName: 'Engineer 2' },
          { userId: 'eng-003', userName: 'Engineer 3' }
        ]
      }),

      // Action 2: Send reminder notifications (succeeds, creates 3 side effects)
      sendReminderNotifications: jest.fn().mockResolvedValue({
        sentCount: 3,
        notificationLogIds: ['notif-log-001', 'notif-log-002', 'notif-log-003']
      }),

      // Action 3: Extract issues (fails with timeout)
      extractIssuesFromReports: jest.fn().mockRejectedValue(
        new Error('TextAnalysisServiceAdapter timeout')
      ),

      // Action 4: Classify issues (not reached)
      classifyAndPrioritizeIssues: jest.fn(),

      // Action 5: Generate meeting material (not reached)
      generateMeetingMaterial: jest.fn(),

      // Action 6: Send manager notification (not reached)
      sendManagerNotification: jest.fn(),

      // Compensation: Rollback notification logs
      rollbackNotificationLogs: jest.fn().mockResolvedValue({
        rolledBackCount: 3,
        deletedLogIds: ['notif-log-001', 'notif-log-002', 'notif-log-003']
      }),

      // Audit logging
      recordAuditEvent: jest.fn().mockResolvedValue({
        auditEventId: 'audit-evt-001',
        recorded: true
      })
    };

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds,
      managerUserId
    };

    // Execute agent
    const result = await runTx1Imp1Agent(input, mockAiClient);

    // Verify Action 1 was called
    expect(mockAiClient.getSubmissionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        targetTeamIds,
        reportDeadlineTime
      })
    );

    // Verify Action 2 was called and notifications were sent
    expect(mockAiClient.sendReminderNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        unsubmittedMemberCount: initialUnsubmittedCount
      })
    );

    // Verify Action 3 was attempted
    expect(mockAiClient.extractIssuesFromReports).toHaveBeenCalledWith(
      expect.objectContaining({
        submittedReportCount: initialReportCount
      })
    );

    // Verify rollback was triggered
    expect(mockAiClient.rollbackNotificationLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationLogIds: ['notif-log-001', 'notif-log-002', 'notif-log-003']
      })
    );

    // Verify audit event was recorded with correct details
    expect(mockAiClient.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'PARTIAL_FAILURE_COMPENSATION',
        failedAction: 'Action 3',
        completedActions: ['Action 1', 'Action 2'],
        compensatedActions: ['Action 2'],
        failureReason: expect.stringMatching(/timeout/),
        compensationStatus: 'completed'
      })
    );

    // Verify final result indicates failure with compensation
    expect(result).toEqual(
      expect.objectContaining({
        executionStatus: 'partial_failure',
        success: false,
        failedAction: 'Action 3'
      })
    );

    // Verify compensation was successful
    expect(result).toEqual(
      expect.objectContaining({
        compensatedActions: expect.arrayContaining(['Action 2']),
        rolledBackNotificationCount: 3
      })
    );

    // Verify side effects were reversed
    expect(result.reportAggregationSummary).toEqual(
      expect.objectContaining({
        submittedCount: initialReportCount,
        unsubmittedMembers: expect.arrayContaining([
          expect.objectContaining({ userId: 'eng-001' }),
          expect.objectContaining({ userId: 'eng-002' }),
          expect.objectContaining({ userId: 'eng-003' })
        ])
      })
    );

    // Verify no partial data persisted
    expect(result.prioritizedIssuesList).toEqual([]);
    expect(result.morningMeetingMaterialUrl).toBeFalsy();
    expect(result.unsubmittedMembersNotified).toBe(false);

    // Verify audit trail contains full compensation details
    expect(result.auditTrail).toEqual(
      expect.objectContaining({
        rollbackExecuted: true,
        rollbackTimestamp: expect.any(Date),
        originalFailureTimestamp: expect.any(Date)
      })
    );

    // Verify idempotency: Actions 4, 5, 6 should not have been called
    expect(mockAiClient.classifyAndPrioritizeIssues).not.toHaveBeenCalled();
    expect(mockAiClient.generateMeetingMaterial).not.toHaveBeenCalled();
    expect(mockAiClient.sendManagerNotification).not.toHaveBeenCalled();

    // Verify final execution timestamp is recorded
    expect(result.executionTimestamp).toEqual(expect.any(Date));
    expect(result.executionTimestamp.getTime()).toBeGreaterThanOrEqual(
      executionTimestamp.getTime()
    );
  });
});