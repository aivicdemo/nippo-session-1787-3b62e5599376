import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent - Duplicate Issue Consolidation Escalation', () => {
  // SCEN-030
  test('should escalate and await human review when duplicate issues are detected before priority assignment', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = '09:00';
    const morningMeetingStartTime = '09:30';
    const teamMemberIds = ['emp_A', 'emp_B', 'emp_C'];
    const managerEmail = 'manager@example.com';

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      teamMemberIds,
      managerEmail,
    };

    // Mock AI client with escalation scenario
    const mockAiClient: Tx1Imp1AiClient = {
      action01GetSubmissionStatus: jest.fn().mockResolvedValue({
        submittedMemberIds: ['emp_A', 'emp_B', 'emp_C'],
        unsubmittedMemberIds: [],
        reports: [
          {
            memberId: 'emp_A',
            content: 'Database connection timeout occurred during morning sync',
            timestamp: new Date('2024-01-15T08:55:00Z'),
          },
          {
            memberId: 'emp_B',
            content: 'Encountered database connection timeout in scheduled job',
            timestamp: new Date('2024-01-15T08:56:00Z'),
          },
          {
            memberId: 'emp_C',
            content: 'Database connection timeout blocked customer query processing',
            timestamp: new Date('2024-01-15T08:57:00Z'),
          },
        ],
      }),

      action02SendUnsubmittedNotification: jest.fn().mockResolvedValue({
        notificationsSent: 0,
        unsubmittedCount: 0,
      }),

      action03ExtractAndClassifyIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: 'issue_001',
            title: 'Database connection timeout',
            category: 'infrastructure',
            reportedByMemberIds: ['emp_A', 'emp_B', 'emp_C'],
            occurrenceCount: 3,
            description: 'Database connection timeout reported by multiple team members',
          },
        ],
        classificationMetadata: {
          totalExtracted: 3,
          uniqueIssues: 1,
          duplicatesDetected: 2,
        },
      }),

      action04AssignPriority: jest.fn().mockResolvedValue({
        escalationDetected: true,
        escalationType: 'DUPLICATE_ISSUE_CONSOLIDATION',
        escalationReason:
          'Multiple reports of identical issue detected before priority assignment. Manual consolidation judgment required.',
        pendingIssues: [
          {
            issueId: 'issue_001',
            title: 'Database connection timeout',
            reportedBy: ['emp_A', 'emp_B', 'emp_C'],
          },
        ],
      }),

      action05GenerateMorningMeetingMaterial: jest.fn(),

      action06SendCompletionNotification: jest.fn(),

      sendManagerNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif_esc_001',
        recipientEmail: managerEmail,
        timestamp: new Date('2024-01-15T09:00:30Z'),
        content: {
          escalationType: 'DUPLICATE_ISSUE_CONSOLIDATION',
          consolidationTargetIssue: 'Database connection timeout',
          reportedByMembers: ['emp_A', 'emp_B', 'emp_C'],
          requiredHumanReviewAction: 'Consolidate and assign unified priority',
        },
      }),

      recordAuditEvent: jest.fn().mockResolvedValue({
        auditEventId: 'audit_001',
        timestamp: new Date('2024-01-15T09:00:35Z'),
        eventType: 'ESCALATION',
        escalationCondition: 'DUPLICATE_ISSUE_CONSOLIDATION',
        targetIssueIds: ['issue_001'],
        status: 'Pending Human Review',
        humanNotificationSentFlag: true,
      }),
    };

    const result = await runTx1Imp1Agent(input, mockAiClient);

    // Verify Action 1 was called to get submission status
    expect(mockAiClient.action01GetSubmissionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        teamMemberIds,
        reportDeadlineTime,
      })
    );

    // Verify Action 2 was called for unsubmitted notification
    expect(mockAiClient.action02SendUnsubmittedNotification).toHaveBeenCalled();

    // Verify Action 3 was called to extract issues
    expect(mockAiClient.action03ExtractAndClassifyIssues).toHaveBeenCalled();

    // Verify Action 4 was called and escalation was detected
    expect(mockAiClient.action04AssignPriority).toHaveBeenCalled();

    // Verify Action 5 and 6 were NOT called (escalation halts further processing)
    expect(mockAiClient.action05GenerateMorningMeetingMaterial).not.toHaveBeenCalled();
    expect(mockAiClient.action06SendCompletionNotification).not.toHaveBeenCalled();

    // Verify manager notification was sent with escalation details
    expect(mockAiClient.sendManagerNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: managerEmail,
        escalationType: 'DUPLICATE_ISSUE_CONSOLIDATION',
        consolidationTargetIssue: 'Database connection timeout',
        reportedByMembers: expect.arrayContaining(['emp_A', 'emp_B', 'emp_C']),
        requiredHumanReviewAction: 'Consolidate and assign unified priority',
      })
    );

    // Verify audit event was recorded with correct metadata
    expect(mockAiClient.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ESCALATION',
        escalationCondition: 'DUPLICATE_ISSUE_CONSOLIDATION',
        targetIssueIds: ['issue_001'],
        status: 'Pending Human Review',
        humanNotificationSentFlag: true,
      })
    );

    // Verify orchestrator return value indicates escalation state
    expect(result).toEqual(
      expect.objectContaining({
        status: 'ESCALATED_AWAITING_HUMAN_REVIEW',
        escalationType: 'DUPLICATE_ISSUE_CONSOLIDATION',
        pendingReviewIssues: expect.arrayContaining([
          expect.objectContaining({
            issueId: 'issue_001',
            title: 'Database connection timeout',
            reportedBy: ['emp_A', 'emp_B', 'emp_C'],
          }),
        ]),
        humanNotificationSent: true,
      })
    );

    // Verify completion timestamp is set
    expect(result.completionTimestamp).toBeInstanceOf(Date);

    // Verify morning meeting material was not generated due to escalation
    expect(result.summaryEmailSent).toBe(false);

    // Verify aggregated data reflects the state at escalation point
    expect(result.aggregatedReportCount).toBe(3);
    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(1);
  });
});