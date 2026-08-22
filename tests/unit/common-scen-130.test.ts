import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-06';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  let mockAiClient: jest.Mocked<Tx7Imp1AiClient>;

  beforeEach(() => {
    mockAiClient = {
      callAction01: jest.fn(),
      callAction02: jest.fn(),
      callAction03: jest.fn(),
      callAction04: jest.fn(),
      callAction05: jest.fn(),
      callAction06: jest.fn(),
      callAction07: jest.fn(),
      callAction08: jest.fn(),
    };
  });

  // SCEN-130: 月次レポート生成から分析完了までの自動実行 - チーム別パフォーマンス指標算出
  test('should execute team performance metrics calculation action (action-06) and embed results in monthly analysis report', async () => {
    const targetMonth = '2024-01';
    const teamId = 'team-engineering-001';
    const triggeredBy = 'schedule' as const;

    const mockTeamPerformanceMetrics = {
      teamId: 'team-engineering-001',
      teamName: 'Engineering Team',
      metrics: [
        {
          metricName: 'issue_completion_rate',
          currentValue: 87.5,
          previousValue: 82.3,
          unit: 'percent',
          status: 'normal' as const,
          anomalyFlag: false,
        },
        {
          metricName: 'issue_response_time_hours',
          currentValue: 4.2,
          previousValue: 5.1,
          unit: 'hours',
          status: 'normal' as const,
          anomalyFlag: false,
        },
        {
          metricName: 'recurrence_rate',
          currentValue: 12.5,
          previousValue: 18.3,
          unit: 'percent',
          status: 'normal' as const,
          anomalyFlag: false,
        },
        {
          metricName: 'report_submission_rate',
          currentValue: 95.0,
          previousValue: 88.0,
          unit: 'percent',
          status: 'normal' as const,
          anomalyFlag: false,
        },
      ],
      calculationTimestamp: new Date('2024-02-01T09:00:00Z'),
      reportDataCount: 156,
      teamAssignmentValidated: true,
    };

    const mockMonthlyAnalysisReport = {
      reportId: 'report-2024-01-001',
      generatedAt: new Date('2024-02-01T09:15:00Z'),
      targetMonth: '2024-01',
      teamId: 'team-engineering-001',
      topPriorityChallenges: [
        {
          issueId: 'issue-001',
          title: 'Database performance degradation',
          priority: 1,
          priorityScore: 9.5,
          affectedTeams: ['team-engineering-001'],
        },
        {
          issueId: 'issue-002',
          title: 'API response timeout under load',
          priority: 2,
          priorityScore: 8.7,
          affectedTeams: ['team-engineering-001'],
        },
        {
          issueId: 'issue-003',
          title: 'Memory leak in background service',
          priority: 3,
          priorityScore: 8.2,
          affectedTeams: ['team-engineering-001'],
        },
      ],
      bottleneckTrend: {
        timeSeriesData: [
          {
            date: '2024-01-01',
            bottleneckSeverity: 6.2,
            affectedIssueCount: 8,
          },
          {
            date: '2024-01-08',
            bottleneckSeverity: 5.8,
            affectedIssueCount: 6,
          },
          {
            date: '2024-01-15',
            bottleneckSeverity: 5.1,
            affectedIssueCount: 5,
          },
          {
            date: '2024-01-22',
            bottleneckSeverity: 4.3,
            affectedIssueCount: 3,
          },
          {
            date: '2024-01-29',
            bottleneckSeverity: 3.9,
            affectedIssueCount: 2,
          },
        ],
        improvementTrend: 'improving' as const,
        recurringIssuePattern: ['database-perf', 'api-timeout', 'memory-leak'],
      },
      teamPerformanceMetrics: mockTeamPerformanceMetrics,
      emailSentTo: ['director@company.com', 'team-lead@company.com'],
      status: 'success' as const,
      auditLog: {
        action06ExecutedAt: new Date('2024-02-01T09:05:00Z'),
        inputDataHash: 'hash-monthly-report-data-2024-01',
        outputMetricSet: mockTeamPerformanceMetrics,
        reportDataCount: 156,
        teamAssignmentValidated: true,
      },
    };

    mockAiClient.callAction06.mockResolvedValue(mockTeamPerformanceMetrics);

    const request = {
      targetMonth,
      teamId,
      triggeredBy,
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(request, mockAiClient);

    expect(mockAiClient.callAction06).toHaveBeenCalledTimes(1);

    const action06CallArgs = mockAiClient.callAction06.mock.calls[0];
    expect(action06CallArgs).toBeDefined();
    expect(action06CallArgs[0]).toMatchObject({
      targetMonth: '2024-01',
      teamId: 'team-engineering-001',
    });

    const generatedPrompt = buildAction06Prompt({
      targetMonth: '2024-01',
      teamId: 'team-engineering-001',
    });
    expect(generatedPrompt).toBeDefined();
    expect(generatedPrompt).toContain('team-engineering-001');

    const promptVersion = ACTION_06_PROMPT_VERSION;
    expect(promptVersion).toBeDefined();
    expect(typeof promptVersion).toBe('string');

    expect(result.teamPerformanceMetrics).toEqual(mockTeamPerformanceMetrics);
    expect(result.teamPerformanceMetrics.teamId).toBe('team-engineering-001');
    expect(result.teamPerformanceMetrics.teamName).toBe('Engineering Team');
    expect(result.teamPerformanceMetrics.metrics).toHaveLength(4);

    const completionRateMetric = result.teamPerformanceMetrics.metrics.find(
      (m) => m.metricName === 'issue_completion_rate'
    );
    expect(completionRateMetric).toBeDefined();
    expect(completionRateMetric?.currentValue).toBe(87.5);
    expect(completionRateMetric?.previousValue).toBe(82.3);
    expect(completionRateMetric?.status).toBe('normal');
    expect(completionRateMetric?.anomalyFlag).toBe(false);

    const responseTimeMetric = result.teamPerformanceMetrics.metrics.find(
      (m) => m.metricName === 'issue_response_time_hours'
    );
    expect(responseTimeMetric).toBeDefined();
    expect(responseTimeMetric?.currentValue).toBe(4.2);
    expect(responseTimeMetric?.previousValue).toBe(5.1);
    expect(responseTimeMetric?.status).toBe('normal');

    const recurrenceRateMetric = result.teamPerformanceMetrics.metrics.find(
      (m) => m.metricName === 'recurrence_rate'
    );
    expect(recurrenceRateMetric).toBeDefined();
    expect(recurrenceRateMetric?.currentValue).toBe(12.5);
    expect(recurrenceRateMetric?.previousValue).toBe(18.3);

    const submissionRateMetric = result.teamPerformanceMetrics.metrics.find(
      (m) => m.metricName === 'report_submission_rate'
    );
    expect(submissionRateMetric).toBeDefined();
    expect(submissionRateMetric?.currentValue).toBe(95.0);

    expect(result.teamPerformanceMetrics.calculationTimestamp).toEqual(
      new Date('2024-02-01T09:00:00Z')
    );
    expect(result.teamPerformanceMetrics.reportDataCount).toBe(156);
    expect(result.teamPerformanceMetrics.teamAssignmentValidated).toBe(true);

    expect(result.auditLog).toBeDefined();
    expect(result.auditLog?.action06ExecutedAt).toBeDefined();
    expect(result.auditLog?.inputDataHash).toBeDefined();
    expect(result.auditLog?.outputMetricSet).toEqual(mockTeamPerformanceMetrics);
    expect(result.auditLog?.reportDataCount).toBe(156);
    expect(result.auditLog?.teamAssignmentValidated).toBe(true);

    expect(result.reportId).toBeDefined();
    expect(result.generatedAt).toBeDefined();
    expect(result.status).toBe('success');

    expect(result.bottleneckTrend).toBeDefined();
    expect(result.bottleneckTrend?.improvementTrend).toBe('improving');
    expect(result.bottleneckTrend?.timeSeriesData).toHaveLength(5);
    expect(result.bottleneckTrend?.recurringIssuePattern).toContain('database-perf');
    expect(result.bottleneckTrend?.recurringIssuePattern).toContain('api-timeout');
    expect(result.bottleneckTrend?.recurringIssuePattern).toContain('memory-leak');
  });
});