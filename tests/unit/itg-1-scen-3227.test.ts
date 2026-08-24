import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent - Malformed, Ambiguous, and Low-Confidence AI Output Handling', () => {
  test('SCEN-3227: エージェントが不正・曖昧・低確信度のAI出力を検出してエスカレーションする', async () => {
    // ========== Setup: Test Data ==========
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-user-001';

    // Aggregated report data from 10 team members
    const sampleAggregatedReports = [
      {
        memberId: 'member-001',
        reportDate: '2024-01-08',
        yesterdayWork: 'Completed API development for feature X',
        todayPlan: 'Continue integration testing',
        issues: 'Database connection timeout occurs intermittently'
      },
      {
        memberId: 'member-002',
        reportDate: '2024-01-08',
        yesterdayWork: 'Fixed UI bug in dashboard',
        todayPlan: 'Code review for PR #234',
        issues: 'Database connection timeout in staging environment'
      },
      {
        memberId: 'member-003',
        reportDate: '2024-01-09',
        yesterdayWork: 'Unit testing completed',
        todayPlan: 'Deploy to production',
        issues: 'Build pipeline failure due to missing dependency'
      },
      {
        memberId: 'member-004',
        reportDate: '2024-01-09',
        yesterdayWork: 'Documentation update',
        todayPlan: 'Team sync meeting',
        issues: 'Build pipeline failure - npm package not found'
      },
      {
        memberId: 'member-005',
        reportDate: '2024-01-10',
        yesterdayWork: 'Security audit of authentication module',
        todayPlan: 'Implement security patch',
        issues: 'Performance degradation in API response time'
      },
      {
        memberId: 'member-006',
        reportDate: '2024-01-10',
        yesterdayWork: 'Database optimization task',
        todayPlan: 'Monitor query performance',
        issues: 'API response time exceeding SLA thresholds'
      },
      {
        memberId: 'member-007',
        reportDate: '2024-01-11',
        yesterdayWork: 'Client requirement gathering',
        todayPlan: 'Design system update',
        issues: 'Resource allocation conflict between projects'
      },
      {
        memberId: 'member-008',
        reportDate: '2024-01-11',
        yesterdayWork: 'Requirements analysis',
        todayPlan: 'Sprint planning preparation',
        issues: 'Resource shortage affecting project timeline'
      },
      {
        memberId: 'member-009',
        reportDate: '2024-01-12',
        yesterdayWork: 'Infrastructure provisioning',
        todayPlan: 'Kubernetes cluster upgrade',
        issues: 'Memory leak detected in production service'
      },
      {
        memberId: 'member-010',
        reportDate: '2024-01-12',
        yesterdayWork: 'Monitoring dashboard setup',
        todayPlan: 'Alert configuration',
        issues: 'Production memory leak causing service restart'
      }
    ];

    // ========== Mock AI Client Setup ==========
    const mockAiClient: Tx9Imp1AiClient = {
      extractKeywords: jest.fn(async () => {
        // Pattern 1: Invalid - returns null
        return null as any;
      }),
      assessImpactScore: jest.fn(async () => {
        // Pattern 2: Invalid - returns invalid string type
        return 'invalid' as any;
      }),
      classifyIssueSeverity: jest.fn(async () => {
        // Pattern 3: Invalid - returns out-of-range value
        return '極高' as any;
      }),
      generateAnalysisReport: jest.fn(async () => ({
        reportId: 'report-001',
        aggregationPeriod: { startDate: aggregationStartDate, endDate: aggregationEndDate },
        productivityMetrics: {
          issueFrequencyPerDay: 2.5,
          averageResolutionDays: 3,
          completionRate: 85
        },
        prioritizedIssues: [],
        countermeasures: []
      }))
    };

    // ========== Test Execution ==========
    let escalationDetected = false;
    let escalationInfo: {
      failedAction: string;
      errorType: 'invalid' | 'ambiguous' | 'low_confidence';
      detectedValue: any;
      message: string;
    } | null = null;

    try {
      const result = await runTx9Imp1Agent(
        {
          aggregationPeriodStart: new Date(`${aggregationStartDate}T00:00:00Z`),
          aggregationPeriodEnd: new Date(`${aggregationEndDate}T23:59:59Z`),
          targetTeamIds,
          managerUserId
        },
        mockAiClient
      );

      // If we reach here, check if result contains escalation info
      if (result && typeof result === 'object') {
        if ('escalationRequired' in result && result.escalationRequired === true) {
          escalationDetected = true;
          escalationInfo = {
            failedAction: result.failedAction || 'unknown',
            errorType: result.errorType || 'invalid',
            detectedValue: result.detectedValue,
            message: result.message || ''
          };
        }
      }
    } catch (error) {
      // Escalation may throw an error with escalation details
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('escalation') || errorMessage.includes('confirmation_required')) {
          escalationDetected = true;
          escalationInfo = {
            failedAction: 'Action1_extractKeywords',
            errorType: 'invalid',
            detectedValue: null,
            message: errorMessage
          };
        }
      }
    }

    // ========== Assertions ==========
    // Verify that orchestrator detected invalid AI output and triggered escalation
    expect(escalationDetected).toBe(true);

    // Verify escalation information structure
    expect(escalationInfo).not.toBeNull();
    if (escalationInfo) {
      expect(escalationInfo.failedAction).toBeTruthy();
      expect(['invalid', 'ambiguous', 'low_confidence']).toContain(escalationInfo.errorType);
      expect(escalationInfo.message).toBeTruthy();
      expect(escalationInfo.message).toMatch(/確認|confirmation|escalation/i);
    }

    // Verify that AI client methods were called
    expect(mockAiClient.extractKeywords).toHaveBeenCalled();

    // Additional test: Verify extractKeywords was invoked with aggregated reports
    const callArgs = (mockAiClient.extractKeywords as jest.Mock).mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(Array.isArray(callArgs[0]) || typeof callArgs[0] === 'object').toBe(true);
  });
});