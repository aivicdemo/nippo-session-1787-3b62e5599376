import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9AggregationRequest, type Tx9AnalysisReport } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent', () => {
  // SCEN-170
  test('should handoff to human before finalizing side effects when system integration error occurs', async () => {
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const targetTeamIds = ['team-001', 'team-002'];
    const requestedByUserId = 'user-director-001';

    const request: Tx9AggregationRequest = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
    };

    let action1Executed = false;
    let action2Executed = false;
    let action3Executed = false;
    let action4Executed = false;
    let action5Executed = false;
    let action6Executed = false;
    let action7Executed = false;

    const aggregatedData = {
      reportCount: 42,
      memberCount: 15,
      teamCount: 2,
    };

    const remindedMembers = [
      { memberId: 'mem-003', name: 'Alice', email: 'alice@example.com' },
      { memberId: 'mem-007', name: 'Bob', email: 'bob@example.com' },
    ];

    const productivityMetrics = {
      issueResolutionSpeed: 3.5,
      reportSubmissionRate: 85.0,
      issueRecurrenceRate: 12.5,
    };

    const prioritizedIssues = [
      {
        issueId: 'iss-001',
        title: 'Critical system outage',
        priority: 1,
        score: 95,
      },
      {
        issueId: 'iss-002',
        title: 'Database performance degradation',
        priority: 2,
        score: 78,
      },
    ];

    const recommendedCountermeasures = [
      {
        measureId: 'meas-001',
        title: 'Infrastructure scaling',
        priority: 1,
      },
    ];

    const fakeAiClient: Tx9Imp1AiClient = {
      executeAction01: async () => {
        action1Executed = true;
        return aggregatedData;
      },
      executeAction02: async () => {
        action2Executed = true;
        return remindedMembers;
      },
      executeAction03: async () => {
        action3Executed = true;
        return productivityMetrics;
      },
      executeAction04: async () => {
        action4Executed = true;
        return prioritizedIssues;
      },
      executeAction05: async () => {
        action5Executed = true;
        throw new Error(
          'System integration error: Failed to connect to external knowledge base API. Timeout after 30 seconds.'
        );
      },
      executeAction06: async () => {
        action6Executed = true;
        return recommendedCountermeasures;
      },
      executeAction07: async () => {
        action7Executed = true;
        return {
          reportId: 'report-9999',
          aggregationPeriod: { startDate: aggregationStartDate, endDate: aggregationEndDate },
          productivityMetrics,
          prioritizedIssues,
          recommendedCountermeasures,
          generatedAt: '2024-01-15T09:00:00Z',
        } as Tx9AnalysisReport;
      },
    };

    let escalationNotificationSent = false;
    let escalationContext: {
      status: string;
      errorType: string;
      rollbackCandidates: string[];
      escalationTargetEmail: string;
    } | null = null;

    const captureEscalation = (context: {
      status: string;
      errorType: string;
      rollbackCandidates: string[];
      escalationTargetEmail: string;
    }) => {
      escalationNotificationSent = true;
      escalationContext = context;
    };

    let result: Tx9AnalysisReport | { status: string; error: string; escalationId: string } | undefined;
    let caughtError: Error | undefined;

    try {
      result = await runTx9Imp1Agent(request, fakeAiClient, { onEscalation: captureEscalation });
    } catch (err) {
      if (err instanceof Error) {
        caughtError = err;
      }
    }

    expect(action1Executed).toBe(true);
    expect(action2Executed).toBe(true);
    expect(action3Executed).toBe(true);
    expect(action4Executed).toBe(true);
    expect(action5Executed).toBe(true);
    expect(action6Executed).toBe(false);
    expect(action7Executed).toBe(false);

    expect(escalationNotificationSent).toBe(true);
    expect(escalationContext).not.toBeNull();

    if (escalationContext) {
      expect(escalationContext.status).toBe('pending_manual_review');
      expect(escalationContext.errorType).toMatch(/system_integration_error|integration/i);
      expect(escalationContext.rollbackCandidates).toContain('aggregated_data');
      expect(escalationContext.rollbackCandidates).toContain('reminder_notifications');
      expect(escalationContext.escalationTargetEmail).toMatch(/@example\.com$/);
    }

    if (typeof result === 'object' && 'status' in result && result.status === 'error') {
      expect(result.error).toMatch(/system|integration|connection/i);
      expect(result.escalationId).toBeDefined();
    }

    expect(caughtError).toBeUndefined();
  });
});