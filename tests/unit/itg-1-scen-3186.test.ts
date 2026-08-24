import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('Tx7Imp1Agent - Monthly Report Generation and Analysis Completion', () => {
  test('SCEN-3186: [normal] Action 6 calculates team performance metrics from accumulated monthly report data and passes to Action 7', async () => {
    const targetMonth = '2024-01';
    const triggeredAt = new Date('2024-02-01T09:00:00Z');
    const managerUserId = 'manager-001';

    const mockAccumulatedReportData = [
      {
        reportId: 'report-001',
        memberId: 'member-001',
        teamId: 'team-a',
        teamName: 'Development Team A',
        reportDate: '2024-01-01',
        yesterday: 'Completed feature X development',
        today: 'Start integration testing',
        challenges: 'Database query optimization needed'
      },
      {
        reportId: 'report-002',
        memberId: 'member-002',
        teamId: 'team-a',
        teamName: 'Development Team A',
        reportDate: '2024-01-01',
        yesterday: 'Fixed bug in module Y',
        today: 'Review pull requests',
        challenges: 'Memory leak investigation'
      },
      {
        reportId: 'report-003',
        memberId: 'member-003',
        teamId: 'team-b',
        teamName: 'QA Team B',
        reportDate: '2024-01-01',
        yesterday: 'Executed test suite',
        today: 'Prepare regression test',
        challenges: 'Test environment setup delayed'
      },
      {
        reportId: 'report-004',
        memberId: 'member-004',
        teamId: 'team-b',
        teamName: 'QA Team B',
        reportDate: '2024-01-01',
        yesterday: 'Created test cases',
        today: 'Run automation tests',
        challenges: 'CI/CD pipeline timeout'
      },
      {
        reportId: 'report-005',
        memberId: 'member-005',
        teamId: 'team-a',
        teamName: 'Development Team A',
        reportDate: '2024-01-02',
        yesterday: 'Completed database migration',
        today: 'Performance monitoring setup',
        challenges: 'API response time degradation'
      },
      {
        reportId: 'report-006',
        memberId: 'member-006',
        teamId: 'team-a',
        teamName: 'Development Team A',
        reportDate: '2024-01-02',
        yesterday: 'Unit test coverage improvement',
        today: 'Code review session',
        challenges: 'Dependency version conflict'
      },
      {
        reportId: 'report-007',
        memberId: 'member-007',
        teamId: 'team-b',
        teamName: 'QA Team B',
        reportDate: '2024-01-02',
        yesterday: 'Performance testing completed',
        today: 'Security scan execution',
        challenges: 'Load balancer configuration issue'
      },
      {
        reportId: 'report-008',
        memberId: 'member-008',
        teamId: 'team-b',
        teamName: 'QA Team B',
        reportDate: '2024-01-02',
        yesterday: 'Defect triage meeting',
        today: 'Root cause analysis',
        challenges: 'Test data inconsistency'
      },
      {
        reportId: 'report-009',
        memberId: 'member-009',
        teamId: 'team-a',
        teamName: 'Development Team A',
        reportDate: '2024-01-03',
        yesterday: 'Architecture review',
        today: 'Implementation of new API',
        challenges: 'Scalability concerns'
      },
      {
        reportId: 'report-010',
        memberId: 'member-010',
        teamId: 'team-b',
        teamName: 'QA Team B',
        reportDate: '2024-01-03',
        yesterday: 'UAT coordination',
        today: 'Final verification test',
        challenges: 'Stakeholder feedback integration'
      }
    ];

    const previousMonthBaselineMetrics = {
      'team-a': {
        performanceScore: 75,
        issueVelocity: 4.2,
        resolutionRate: 85
      },
      'team-b': {
        performanceScore: 72,
        issueVelocity: 3.8,
        resolutionRate: 82
      }
    };

    const expectedTeamMetricsResponse = {
      teamMetrics: [
        {
          teamId: 'team-a',
          teamName: 'Development Team A',
          performanceScore: 82,
          issueVelocity: 4.8,
          resolutionRate: 88,
          bottleneckRiskLevel: 'medium' as const
        },
        {
          teamId: 'team-b',
          teamName: 'QA Team B',
          performanceScore: 79,
          issueVelocity: 4.1,
          resolutionRate: 85,
          bottleneckRiskLevel: 'low' as const
        }
      ],
      calculatedAt: '2024-02-01T09:15:00Z',
      version: '1.0.0'
    };

    const buildAction06PromptSpy = jest.fn();
    const callAction06Spy = jest.fn().mockResolvedValue(expectedTeamMetricsResponse);

    const buildAction07PromptSpy = jest.fn();
    const callAction07Spy = jest.fn().mockResolvedValue({
      reportId: 'monthly-report-2024-01',
      analysisResultSummary: {
        topPriorityChallenges: [],
        performanceMetrics: expectedTeamMetricsResponse.teamMetrics,
        bottleneckTrend: {
          timeSeriesData: [],
          improvementTrend: 'stable' as const,
          recurringIssuePattern: []
        }
      },
      status: 'success' as const
    });

    const mockAiClient: Tx7Imp1AiClient = {
      buildAction01Prompt: jest.fn(),
      callAction01: jest.fn(),
      buildAction02Prompt: jest.fn(),
      callAction02: jest.fn(),
      buildAction03Prompt: jest.fn(),
      callAction03: jest.fn(),
      buildAction04Prompt: jest.fn(),
      callAction04: jest.fn(),
      buildAction05Prompt: jest.fn(),
      callAction05: jest.fn(),
      buildAction06Prompt: buildAction06PromptSpy.mockReturnValue('action-06-prompt'),
      callAction06: callAction06Spy,
      buildAction07Prompt: buildAction07PromptSpy.mockReturnValue('action-07-prompt'),
      callAction07: callAction07Spy
    };

    const input = {
      triggerTimestamp: triggeredAt,
      targetMonth: targetMonth,
      managerUserId: managerUserId,
      includeDetailedAnalysis: true,
      accumulatedReportData: mockAccumulatedReportData,
      previousMonthMetrics: previousMonthBaselineMetrics
    };

    const auditLog: Array<{
      actionId: string;
      status: string;
      inputDataItemCount?: number;
      outputMetricsCount?: number;
      executedAt: string;
      agentId: string;
    }> = [];

    const mockLogAudit = (event: {
      actionId: string;
      status: string;
      inputDataItemCount?: number;
      outputMetricsCount?: number;
      executedAt: string;
      agentId: string;
    }) => {
      auditLog.push(event);
    };

    await runTx7Imp1Agent(input, mockAiClient, mockLogAudit);

    expect(buildAction06PromptSpy).toHaveBeenCalled();
    expect(callAction06Spy).toHaveBeenCalled();

    const action06Call = callAction06Spy.mock.calls[0];
    expect(action06Call).toBeDefined();
    const action06Input = action06Call[0];
    expect(action06Input).toContain('action-06-prompt');

    expect(expectedTeamMetricsResponse).toHaveProperty('teamMetrics');
    expect(Array.isArray(expectedTeamMetricsResponse.teamMetrics)).toBe(true);
    expect(expectedTeamMetricsResponse.teamMetrics.length).toBeLessThanOrEqual(10);

    expectedTeamMetricsResponse.teamMetrics.forEach((metric) => {
      expect(metric).toHaveProperty('teamId');
      expect(metric).toHaveProperty('teamName');
      expect(metric).toHaveProperty('performanceScore');
      expect(metric).toHaveProperty('issueVelocity');
      expect(metric).toHaveProperty('resolutionRate');
      expect(metric).toHaveProperty('bottleneckRiskLevel');

      expect(typeof metric.performanceScore).toBe('number');
      expect(typeof metric.issueVelocity).toBe('number');
      expect(typeof metric.resolutionRate).toBe('number');

      expect(metric.performanceScore).toBeGreaterThanOrEqual(0);
      expect(metric.performanceScore).toBeLessThanOrEqual(100);
      expect(metric.issueVelocity).toBeGreaterThanOrEqual(0);
      expect(metric.issueVelocity).toBeLessThanOrEqual(100);
      expect(metric.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(metric.resolutionRate).toBeLessThanOrEqual(100);

      expect(['high', 'medium', 'low']).toContain(metric.bottleneckRiskLevel);
    });

    expect(buildAction07PromptSpy).toHaveBeenCalled();
    expect(callAction07Spy).toHaveBeenCalled();

    const action07Call = callAction07Spy.mock.calls[0];
    expect(action07Call).toBeDefined();
    const action07Input = action07Call[0];
    expect(action07Input).toContain('action-07-prompt');

    expect(auditLog.length).toBeGreaterThan(0);

    const action06AuditEvent = auditLog.find((e) => e.actionId === 'action-06');
    expect(action06AuditEvent).toBeDefined();
    expect(action06AuditEvent!.status).toBe('success');
    expect(action06AuditEvent!.inputDataItemCount).toBe(10);
    expect(action06AuditEvent!.outputMetricsCount).toBe(2);
    expect(action06AuditEvent!.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(action06AuditEvent!.agentId).toBe(managerUserId);
  });
});