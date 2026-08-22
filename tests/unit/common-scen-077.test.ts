import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-05';

describe('Tx4Imp1Agent - Action 5 Recommended Countermeasure Generation', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-077
  test('should generate recommended countermeasure plans for prioritized issues with all required fields', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const targetDate = '2024-01-15';
    const executorUserId = 'user-director-001';
    const teamId = 'team-engineering-001';

    const mockPrioritizedIssues = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout in production',
        severity: 'HIGH',
        urgency: 'URGENT',
        description: 'Production database experiencing intermittent connection timeouts',
        impactScope: 'All services',
        recurrenceProbability: 0.75,
        similarPastIssues: [
          {
            id: 'hist-001',
            resolutionMethod: 'Increased connection pool size from 50 to 200',
            resolutionDays: 2,
          },
        ],
      },
      {
        issueId: 'issue-002',
        title: 'Memory leak in worker service',
        severity: 'MEDIUM',
        urgency: 'HIGH',
        description: 'Worker service memory usage growing 50MB per hour',
        impactScope: 'Background processing',
        recurrenceProbability: 0.45,
        similarPastIssues: [
          {
            id: 'hist-002',
            resolutionMethod: 'Identified unclosed stream handler; added proper cleanup',
            resolutionDays: 1,
          },
        ],
      },
      {
        issueId: 'issue-003',
        title: 'API rate limiting inconsistency',
        severity: 'MEDIUM',
        urgency: 'MEDIUM',
        description: 'Rate limiter returning 429 on valid requests',
        impactScope: 'External API clients',
        recurrenceProbability: 0.20,
        similarPastIssues: [],
      },
    ];

    const mockAiClient = {
      callAction01: jest.fn().mockResolvedValue({
        dashboard_data: {
          submitted_count: 12,
          pending_count: 1,
          issues_extracted: 15,
        },
      }),
      callAction02: jest.fn().mockResolvedValue({
        issues: mockPrioritizedIssues,
      }),
      callAction03: jest.fn().mockResolvedValue({
        recurrence_risk_scores: [
          { issueId: 'issue-001', riskScore: 0.85 },
          { issueId: 'issue-002', riskScore: 0.60 },
          { issueId: 'issue-003', riskScore: 0.25 },
        ],
      }),
      callAction04: jest.fn().mockResolvedValue({
        prioritized_issues: mockPrioritizedIssues,
      }),
      callAction05: jest.fn().mockResolvedValue({
        countermeasure_plans: [
          {
            issueId: 'issue-001',
            planId: 'plan-001',
            recommendedActions: [
              'Increase connection pool size to 300',
              'Add connection pool monitoring dashboard',
              'Deploy connection timeout retry logic',
            ],
            estimatedResolutionDays: 1,
            assignedOwner: 'backend-team',
            rootCauseHypothesis: 'Insufficient connection pool capacity under peak load',
            executionStartDate: '2024-01-15',
            expectedKpi: 'Zero connection timeouts in production for 24 hours',
          },
          {
            issueId: 'issue-002',
            planId: 'plan-002',
            recommendedActions: [
              'Audit stream resource lifecycle in worker service',
              'Add resource cleanup in finally blocks',
              'Deploy memory monitoring alerts',
            ],
            estimatedResolutionDays: 1,
            assignedOwner: 'infrastructure-team',
            rootCauseHypothesis: 'Unclosed file or stream handles in async operations',
            executionStartDate: '2024-01-15',
            expectedKpi: 'Memory usage stable within 100MB variance',
          },
          {
            issueId: 'issue-003',
            planId: 'plan-003',
            recommendedActions: [
              'Review rate limiting algorithm logic',
              'Add comprehensive logging to rate limiter',
              'Test rate limiter against known edge cases',
            ],
            estimatedResolutionDays: 2,
            assignedOwner: 'api-team',
            rootCauseHypothesis: 'Rate limiter state inconsistency or clock drift',
            executionStartDate: '2024-01-16',
            expectedKpi: 'Rate limiter returns 200 for all valid requests',
          },
        ],
      }),
      callAction06: jest.fn().mockResolvedValue({
        dashboard_report: {
          generated_at: executionTimestamp.toISOString(),
          status: 'completed',
        },
      }),
      callAction07: jest.fn().mockResolvedValue({
        email_sent: true,
      }),
    };

    const request = {
      executionTimestamp,
      targetDate,
      executorUserId,
      teamId,
    };

    const result = await runTx4Imp1Agent(request, mockAiClient);

    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(result.aggregatedReportCount).toBe(12);
    expect(result.extractedIssueCount).toBe(15);
    expect(result.prioritizedIssues).toHaveLength(3);

    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.planId).toBeDefined();
    expect(result.countermeasurePlan.recommendedActions).toEqual([
      'Increase connection pool size to 300',
      'Add connection pool monitoring dashboard',
      'Deploy connection timeout retry logic',
    ]);
    expect(result.countermeasurePlan.estimatedResolutionDays).toBe(1);
    expect(result.countermeasurePlan.assignedOwner).toBe('backend-team');

    expect(result.summaryEmailSent).toBe(true);
    expect(result.completionTimestamp).toBeDefined();
    expect(new Date(result.completionTimestamp).getTime()).toBeGreaterThanOrEqual(
      executionTimestamp.getTime()
    );

    expect(mockAiClient.callAction05).toHaveBeenCalledWith(
      expect.objectContaining({
        prioritized_issues: mockPrioritizedIssues,
      })
    );

    const action05Prompt = buildAction05Prompt(mockPrioritizedIssues);
    expect(action05Prompt).toContain('issue-001');
    expect(action05Prompt).toContain('HIGH');
    expect(action05Prompt).toContain('URGENT');
    expect(action05Prompt).toContain('推奨対応方針');

    expect(ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');
  });
});