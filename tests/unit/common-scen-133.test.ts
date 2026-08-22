import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-133: monthly report agent escalates on data extraction inconsistency before side effect confirmation', async () => {
    // Setup: Mock data for the test scenario
    const mockReportTriggerId = 'monthly-2024-01';
    const mockMemberId = 'member-001';
    const mockReportData = {
      id: 'report-001',
      memberId: mockMemberId,
      submittedAt: '2024-01-15T09:30:00Z',
      content: 'Progress update with issues',
      status: 'submitted' as const,
    };

    const mockUnsubmittedMembers = [
      {
        id: 'member-002',
        name: 'Alice',
        email: 'alice@company.com',
        lastReminderSentAt: null,
      },
      {
        id: 'member-003',
        name: 'Bob',
        email: 'bob@company.com',
        lastReminderSentAt: '2024-01-14T18:00:00Z',
      },
    ];

    const mockAuditLog = {
      eventType: 'ESCALATION' as const,
      reason: 'DATA_EXTRACTION_INCONSISTENCY',
      timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
      agentId: 'tx-7-imp-1',
      state: 'HANDOFF_TO_HUMAN',
      escalationAction: 'Action 2: Data Extraction',
      inconsistencyDetails: {
        missingFields: ['submissionDeadline'],
        invalidFormats: [{ field: 'submittedAt', expected: 'ISO8601', received: 'invalid' }],
      },
      parentReportTriggerId: mockReportTriggerId,
    };

    const mockEscalationNotification = {
      recipientType: 'human' as const,
      recipientId: 'director-001',
      errorReason: 'データ不整合',
      occurredAt: 'Action 2: 当月蓄積報告データ抽出',
      inconsistencyDetails: mockAuditLog.inconsistencyDetails,
      reportStatus: 'HANDOFF_REQUIRED' as const,
      directorNotificationState: 'PENDING' as const,
    };

    // Action: Call sendUnsubmittedReminder with escalation scenario context
    const result = await sendUnsubmittedReminder({
      unsubmittedMembers: mockUnsubmittedMembers,
      reportTriggerId: mockReportTriggerId,
      escalationContext: {
        hasDataExtractionError: true,
        errorMessage: 'Data inconsistency detected in aggregated report data',
        failedValidationFields: ['submissionDeadline', 'submittedAt'],
        actionFailedAt: 'Action 2',
      },
      auditLogEntry: mockAuditLog,
    });

    // Assert: Verify escalation handoff occurred before side effects
    expect(result).toEqual({
      escalationTriggered: true,
      escalationReason: 'DATA_EXTRACTION_INCONSISTENCY',
      handoffToHuman: {
        enabled: true,
        notification: mockEscalationNotification,
      },
      remindersNotSent: {
        count: 2,
        members: mockUnsubmittedMembers.map((m) => ({ id: m.id, email: m.email })),
        reason: 'escalation_halts_processing',
      },
      sideEffectsConfirmed: false,
      reportGenerated: false,
      analysisExecuted: false,
      priorityAssignmentCompleted: false,
      directorNotified: false,
      auditEvent: {
        eventType: 'ESCALATION',
        reason: 'DATA_EXTRACTION_INCONSISTENCY',
        timestamp: mockAuditLog.timestamp,
        agentId: 'tx-7-imp-1',
        state: 'HANDOFF_TO_HUMAN',
        stopAction: 'Action 2',
        preventedActions: ['Action 3', 'Action 4', 'Action 5', 'Action 6', 'Action 7'],
      },
    });

    // Assert: Verify side effects are not confirmed
    expect(result.sideEffectsConfirmed).toBe(false);
    expect(result.reportGenerated).toBe(false);
    expect(result.analysisExecuted).toBe(false);
    expect(result.priorityAssignmentCompleted).toBe(false);
    expect(result.directorNotified).toBe(false);

    // Assert: Verify no reminders were sent
    expect(result.remindersNotSent.count).toBe(2);
    expect(result.remindersNotSent.reason).toBe('escalation_halts_processing');

    // Assert: Verify escalation notification content
    expect(result.handoffToHuman.enabled).toBe(true);
    expect(result.handoffToHuman.notification.errorReason).toBe('データ不整合');
    expect(result.handoffToHuman.notification.occurredAt).toBe('Action 2: 当月蓄積報告データ抽出');
    expect(result.handoffToHuman.notification.directorNotificationState).toBe('PENDING');
    expect(result.handoffToHuman.notification.reportStatus).toBe('HANDOFF_REQUIRED');

    // Assert: Verify audit log entry
    expect(result.auditEvent.eventType).toBe('ESCALATION');
    expect(result.auditEvent.reason).toBe('DATA_EXTRACTION_INCONSISTENCY');
    expect(result.auditEvent.state).toBe('HANDOFF_TO_HUMAN');
    expect(result.auditEvent.stopAction).toBe('Action 2');
    expect(result.auditEvent.preventedActions).toContain('Action 3');
    expect(result.auditEvent.preventedActions).toContain('Action 4');
    expect(result.auditEvent.preventedActions).toContain('Action 5');
    expect(result.auditEvent.preventedActions).toContain('Action 6');
    expect(result.auditEvent.preventedActions).toContain('Action 7');

    // Assert: Verify inconsistency details are captured
    expect(result.auditEvent).toHaveProperty('preventedActions');
    expect(result.handoffToHuman.notification.inconsistencyDetails).toEqual(mockAuditLog.inconsistencyDetails);
  });
});