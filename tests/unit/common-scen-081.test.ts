import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4AgentExecutionRequest, type Tx4AgentExecutionResult } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('Tx4Imp1Agent - Escalation Handling', () => {
  // SCEN-081
  test('should escalate and halt execution when critical business decision required', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const targetDate = '2024-01-15';
    const executorUserId = 'user-chief-001';
    const teamId = 'team-engineering-001';

    const request: Tx4AgentExecutionRequest = {
      executionTimestamp,
      targetDate,
      executorUserId,
      teamId,
    };

    const auditLog: Array<{
      eventType: string;
      timestamp: Date;
      state: {
        reviewRequired: boolean;
        escalationReason?: string;
        managerId?: string;
        escalationTimestamp?: Date;
      };
    }> = [];

    const fakeAiClient: Tx4Imp1AiClient = {
      // Action 1: Aggregate real-time progress data
      aggregateProgressData: async () => ({
        aggregatedCount: 3,
        sources: ['jira', 'asana', 'github'],
        timestamp: executionTimestamp,
      }),

      // Action 2: Detect delays, missing reports, anomalies
      detectAnomalies: async () => ({
        delayedTasks: 2,
        missingReports: 1,
        anomalies: 3,
        extractedIssues: [
          {
            id: 'issue-001',
            title: 'API response delay',
            severity: 'high',
            source: 'performance-dashboard',
          },
          {
            id: 'issue-002',
            title: 'Database connection pool exhaustion',
            severity: 'critical',
            source: 'monitoring-alert',
          },
          {
            id: 'issue-003',
            title: 'Staging deployment failed',
            severity: 'high',
            source: 'ci-cd-log',
          },
        ],
      }),

      // Action 3: Match against past similar issues
      evaluateRecurrenceRisk: async () => ({
        matchedIssues: 2,
        riskScores: [0.85, 0.72],
        riskEvaluations: [
          {
            currentIssueId: 'issue-001',
            pastIssueId: 'past-issue-2023-045',
            recurrenceProbability: 0.85,
            daysUntilNextOccurrence: 2,
          },
          {
            currentIssueId: 'issue-003',
            pastIssueId: 'past-issue-2023-089',
            recurrenceProbability: 0.72,
            daysUntilNextOccurrence: 5,
          },
        ],
      }),

      // Action 4: Auto-assign priority
      prioritizeIssues: async () => ({
        prioritizedCount: 3,
        priorities: [
          {
            issueId: 'issue-002',
            priority: 'critical',
            urgency: 'immediate',
            businessImpact: 'service_degradation',
          },
          {
            issueId: 'issue-001',
            priority: 'high',
            urgency: 'within_2hours',
            businessImpact: 'performance_impact',
          },
          {
            issueId: 'issue-003',
            priority: 'high',
            urgency: 'within_4hours',
            businessImpact: 'deployment_blocked',
          },
        ],
      }),

      // Action 5: Generate recommended countermeasures
      // This is where escalation is triggered
      generateCountermeasurePlan: async () => ({
        planId: 'plan-2024-01-15-001',
        recommendedActions: [
          'Immediately scale database connection pool to 500',
          'Activate backup API gateway',
          'Page database SRE on-call engineer',
          'Notify VP of Engineering of ongoing incident',
        ],
        estimatedResolutionDays: 0.5,
        assignedOwner: 'sre-team-lead',
        escalationFlag: true,
        escalationReason: '経営判断が必要な重大課題',
        requiredApproverRole: 'VP_ENGINEERING',
      }),

      // Action 6: Create morning report dashboard (should not be called)
      createDashboardReport: async () => {
        throw new Error('Action 6 should not execute during escalation');
      },

      // Action 7: Notify missing report members (should not be called)
      notifyMissingReportMembers: async () => {
        throw new Error('Action 7 should not execute during escalation');
      },
    };

    let result: Tx4AgentExecutionResult | null = null;
    let executionError: Error | null = null;

    try {
      result = await runTx4Imp1Agent(request, fakeAiClient, {
        onAuditEvent: (event) => {
          auditLog.push(event);
        },
      });
    } catch (error) {
      executionError = error as Error;
    }

    // Verify escalation was triggered during Action 5
    expect(auditLog.length).toBeGreaterThan(0);

    const escalationEvent = auditLog.find(
      (event) => event.eventType === 'escalation_triggered'
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.state.reviewRequired).toBe(true);
    expect(escalationEvent?.state.escalationReason).toBe(
      '経営判断が必要な重大課題'
    );
    expect(escalationEvent?.state.managerId).toBeDefined();
    expect(escalationEvent?.state.escalationTimestamp).toBeDefined();

    // Verify execution halted before side effects (Actions 6 & 7)
    expect(result).toBeNull();

    // Verify no error was thrown (graceful escalation halt)
    expect(executionError).toBeNull();

    // Verify audit log contains state at escalation point
    const stateAtEscalation = auditLog.find(
      (event) => event.state.reviewRequired === true
    );
    expect(stateAtEscalation).toBeDefined();
    expect(stateAtEscalation?.state).toEqual({
      reviewRequired: true,
      escalationReason: '経営判断が必要な重大課題',
      managerId: expect.any(String),
      escalationTimestamp: expect.any(Date),
    });

    // Verify no action events for Action 6 or Action 7
    const action6Event = auditLog.find(
      (event) => event.eventType === 'action_6_completed'
    );
    const action7Event = auditLog.find(
      (event) => event.eventType === 'action_7_completed'
    );
    expect(action6Event).toBeUndefined();
    expect(action7Event).toBeUndefined();
  });
});