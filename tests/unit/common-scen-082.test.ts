import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4AgentExecutionRequest, Tx4AgentExecutionResult } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('Tx4Imp1Agent', () => {
  // SCEN-082: [error] ダッシュボード分析から課題指示までの自動実行 AIエージェント - 曖昧な案件でのエスカレーション
  test('should escalate ambiguous priority judgment before side effects confirmation', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const targetDate = '2024-01-15';
    const executorUserId = 'user-director-001';
    const teamId = 'team-engineering-001';

    const request: Tx4AgentExecutionRequest = {
      executionTimestamp,
      targetDate,
      executorUserId,
      teamId,
    };

    // Ambiguous priority judgment case: confidence score below threshold
    const ambiguousCaseData = {
      caseId: 'case-ambiguous-001',
      title: 'Cross-department feature priority conflict',
      importance: 7,
      urgency: 7,
      confidenceScore: 0.35,
      ambiguityFlag: 'multiple_equally_valid_patterns',
      affectedDepartments: ['backend', 'frontend', 'qa'],
      competingPriorities: [
        {
          pattern: 'high_importance_low_urgency',
          score: 0.48,
        },
        {
          pattern: 'low_importance_high_urgency',
          score: 0.47,
        },
      ],
    };

    // Fake AI client that returns ambiguous case data
    const fakeAiClient: Tx4Imp1AiClient = {
      aggregateDashboardData: async () => ({
        aggregatedIssues: [ambiguousCaseData],
        unsubmittedMembers: ['member-003'],
        dashboardMetrics: {
          totalProgress: 65,
          delayedTasks: 3,
          anomalyFlags: ['ambiguous_priority'],
        },
      }),
      prioritizeIssues: async (issues) => ({
        prioritizedList: [
          {
            issueId: ambiguousCaseData.caseId,
            priority: 'ESCALATION_REQUIRED',
            priorityScore: null,
            confidenceScore: ambiguousCaseData.confidenceScore,
            escalationReason: 'ambiguous_priority_judgment',
            competingPatterns: ambiguousCaseData.competingPriorities,
            requiresHumanJudgment: true,
          },
        ],
      }),
      generateCountermeasurePlan: async () => ({
        planId: 'plan-pending-001',
        recommendedActions: [],
        estimatedResolutionDays: null,
        assignedOwner: null,
        status: 'awaiting_human_confirmation',
      }),
      sendSummaryEmail: async () => ({
        emailSent: false,
        reason: 'escalation_in_progress_pending_human_judgment',
        recipientEmail: null,
      }),
      recordEscalationEvent: async (escalationData) => ({
        auditEventId: 'audit-event-001',
        eventType: 'escalation',
        reason: escalationData.reason,
        timestamp: new Date('2024-01-15T08:15:00Z'),
        actor: 'ai_agent_tx4_imp1',
        caseId: escalationData.caseId,
        escalationDetails: {
          confidenceScore: ambiguousCaseData.confidenceScore,
          competingPatterns: ambiguousCaseData.competingPriorities,
          aiJudgmentReason: 'importance_urgency_equally_high_ambiguous_context',
          requiresManualDecision: true,
        },
      }),
    };

    const result = await runTx4Imp1Agent(request, fakeAiClient);

    // Assertion 1: Escalation was triggered
    expect(result.completionTimestamp).toBeDefined();
    expect(result.completionTimestamp.getTime()).toBeGreaterThan(
      executionTimestamp.getTime()
    );

    // Assertion 2: Ambiguous case was detected and escalated
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBeGreaterThan(0);
    const escalatedIssue = result.prioritizedIssues.find(
      (issue) => issue.escalationReason === 'ambiguous_priority_judgment'
    );
    expect(escalatedIssue).toBeDefined();
    expect(escalatedIssue?.confidenceScore).toBe(0.35);
    expect(escalatedIssue?.requiresHumanJudgment).toBe(true);

    // Assertion 3: Side effects (summary email and confirmed dashboard) were NOT executed
    expect(result.summaryEmailSent).toBe(false);

    // Assertion 4: Countermeasure plan is in awaiting confirmation state
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.status).toBe('awaiting_human_confirmation');
    expect(result.countermeasurePlan.assignedOwner).toBeNull();
    expect(result.countermeasurePlan.recommendedActions).toHaveLength(0);

    // Assertion 5: Escalation event was recorded with required fields
    expect(result.escalationEventId).toBeDefined();
    expect(result.escalationEventReason).toBe('ambiguous_priority_judgment');
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails.confidenceScore).toBe(0.35);
    expect(result.escalationDetails.competingPatterns).toHaveLength(2);
    expect(result.escalationDetails.competingPatterns[0]).toEqual({
      pattern: 'high_importance_low_urgency',
      score: 0.48,
    });
    expect(result.escalationDetails.requiresManualDecision).toBe(true);

    // Assertion 6: Multiple judgment patterns are included in escalation details
    expect(result.escalationDetails.competingPatterns.length).toBeGreaterThanOrEqual(
      2
    );
    result.escalationDetails.competingPatterns.forEach((pattern) => {
      expect(pattern.pattern).toBeDefined();
      expect(typeof pattern.score).toBe('number');
      expect(pattern.score).toBeGreaterThanOrEqual(0);
      expect(pattern.score).toBeLessThanOrEqual(1);
    });

    // Assertion 7: Unsubmitted members were tracked separately
    expect(result.aggregatedReportCount).toBeGreaterThanOrEqual(0);
    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(1);

    // Assertion 8: Execution state indicates escalation pending human confirmation
    expect(result.executionStatus).toBe('escalation_pending_human_confirmation');
    expect(result.escalatedCaseCount).toBe(1);
  });
});