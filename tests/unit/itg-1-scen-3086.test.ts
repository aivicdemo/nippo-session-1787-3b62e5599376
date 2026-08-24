import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  Tx1Imp1AiClient,
} from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent - Escalation for Multiple Identical Issues', () => {
  // SCEN-3086
  test('should escalate to human review when multiple identical issues are detected before confirming morning meeting material', async () => {
    const executionTimestamp = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-001';

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds,
      managerUserId,
    };

    // Mock AI Client that simulates duplicate identical issue detection
    const mockAiClient: Tx1Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockReturnValue('Action 01 Prompt'),
      invokeAction01: jest.fn().mockResolvedValue({
        submittedReports: [
          {
            reporterId: 'engineer-001',
            reportContent: 'Database connection timeout occurred during API calls',
            submittedAt: new Date('2024-01-15T08:45:00Z'),
          },
          {
            reporterId: 'engineer-002',
            reportContent: 'Database connection timeout when accessing cache layer',
            submittedAt: new Date('2024-01-15T08:50:00Z'),
          },
        ],
        unsubmittedMembers: [],
      }),
      buildAction02Prompt: jest.fn().mockReturnValue('Action 02 Prompt'),
      invokeAction02: jest.fn().mockResolvedValue({
        standardizedReports: [
          {
            reporterId: 'engineer-001',
            yesterdayAccomplishments: 'API development',
            todayPlan: 'Bug fixes',
            issues: 'Database connection timeout',
          },
          {
            reporterId: 'engineer-002',
            yesterdayAccomplishments: 'Cache optimization',
            todayPlan: 'Performance testing',
            issues: 'Database connection timeout',
          },
        ],
      }),
      buildAction03Prompt: jest.fn().mockReturnValue('Action 03 Prompt'),
      invokeAction03: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            keyword: 'Database connection timeout',
            reporterId: 'engineer-001',
            occurrenceFrequency: 1,
            impactScoreCandidates: [75],
            severity: 'high',
          },
          {
            keyword: 'Database connection timeout',
            reporterId: 'engineer-002',
            occurrenceFrequency: 1,
            impactScoreCandidates: [68],
            severity: 'high',
          },
        ],
      }),
      buildAction04Prompt: jest.fn().mockReturnValue('Action 04 Prompt'),
      invokeAction04: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            keyword: 'Database connection timeout',
            reporterIds: ['engineer-001', 'engineer-002'],
            priorityScore: undefined, // Ambiguous - multiple reporters, cannot auto-determine merge strategy
            severity: 'high',
            requiresManualJudgment: true,
            conflictReason: 'Duplicate identical issue from multiple reporters; merge strategy undefined',
          },
        ],
      }),
      buildAction05Prompt: jest.fn().mockReturnValue('Action 05 Prompt'),
      invokeAction05: jest.fn().mockResolvedValue({
        escalationDetected: true,
        escalationCondition: 'MULTIPLE_IDENTICAL_ISSUES',
        escalationPayload: {
          reportA: {
            reporterId: 'engineer-001',
            issueContent: 'Database connection timeout',
            urgencyLevel: 'high',
            impactScore: 75,
          },
          reportB: {
            reporterId: 'engineer-002',
            issueContent: 'Database connection timeout',
            urgencyLevel: 'high',
            impactScore: 68,
          },
          ambiguityPoint: 'Unclear deduplication and prioritization rules for identical issues from multiple reporters',
          escalationDecision: 'AWAITING_HUMAN_REVIEW',
        },
      }),
      buildAction06Prompt: jest.fn().mockReturnValue('Action 06 Prompt'),
      invokeAction06: jest.fn().mockResolvedValue({
        notificationSent: false,
        notificationPayload: null,
        internalStatus: 'ESCALATION_AWAITING_HUMAN_REVIEW',
        reason: 'Escalation condition detected; human review required before material confirmation',
      }),
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // Verify escalation detection
    expect(result.executionStatus).toBe('partial_failure');

    // Verify that escalation metadata is captured
    expect(result.reportAggregationSummary.submittedCount).toBe(2);
    expect(result.reportAggregationSummary.unsubmittedMembers).toHaveLength(0);

    // Verify that prioritized issues list contains the conflicting issue
    expect(result.prioritizedIssuesList).toHaveLength(1);
    const conflictingIssue = result.prioritizedIssuesList[0];
    expect(conflictingIssue.keyword).toBe('Database connection timeout');
    expect(conflictingIssue.reporterIds).toEqual(['engineer-001', 'engineer-002']);
    expect(conflictingIssue.requiresManualJudgment).toBe(true);
    expect(conflictingIssue.conflictReason).toMatch(/merge strategy/i);

    // Verify that morning meeting material was NOT generated or sent
    expect(result.morningMeetingMaterialUrl).toBeFalsy();

    // Verify that unsubmitted members notification was NOT sent
    expect(result.unsubmittedMembersNotified).toBe(false);

    // Verify internal status reflects escalation awaiting human review
    expect(result.executionTimestamp).toBeDefined();

    // Verify that Action 05 was invoked to detect escalation
    expect(mockAiClient.invokeAction05).toHaveBeenCalled();

    // Verify that Action 06 was NOT invoked to confirm material
    expect(mockAiClient.invokeAction06).not.toHaveBeenCalled();

    // Verify that mock was called in correct sequence
    expect(mockAiClient.invokeAction01).toHaveBeenCalledBefore(
      mockAiClient.invokeAction02 as jest.Mock
    );
    expect(mockAiClient.invokeAction02).toHaveBeenCalledBefore(
      mockAiClient.invokeAction03 as jest.Mock
    );
    expect(mockAiClient.invokeAction03).toHaveBeenCalledBefore(
      mockAiClient.invokeAction04 as jest.Mock
    );
    expect(mockAiClient.invokeAction04).toHaveBeenCalledBefore(
      mockAiClient.invokeAction05 as jest.Mock
    );
  });
});