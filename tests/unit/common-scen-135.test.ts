import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-135
  test('分析結果が過去の傾向と大きく乖離した場合にエスカレーションして副作用を保留する', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      action01_collectMonthlyData: jest.fn(async () => ({
        reportId: 'report_tx7_20240115_001',
        targetMonth: '2024-01',
        collectStatus: 'success',
        totalReportsCollected: 10,
        missingReports: [],
      })),

      action02_generateReportStructure: jest.fn(async () => ({
        reportStructureId: 'struct_20240115_001',
        sections: [
          'executive_summary',
          'issue_timeline',
          'bottleneck_analysis',
          'team_performance',
        ],
        generationTimestamp: '2024-01-15T08:00:00Z',
      })),

      action03_analyzeTimeSeriesChanges: jest.fn(async () => ({
        analysisId: 'ts_20240115_001',
        timeSeriesData: [
          {
            date: '2024-01-01',
            issueCount: 48,
            averageSeverity: 7.2,
            resolutionRate: 0.65,
          },
          {
            date: '2024-01-10',
            issueCount: 52,
            averageSeverity: 7.5,
            resolutionRate: 0.62,
          },
          {
            date: '2024-01-15',
            issueCount: 50,
            averageSeverity: 7.1,
            resolutionRate: 0.64,
          },
        ],
        trend: 'stable',
      })),

      action04_analyzeBottleneckTrend: jest.fn(async () => ({
        bottleneckId: 'bn_20240115_001',
        timeSeriesBottleneck: [
          { date: '2024-01-01', severity: 6.8, topCategories: ['api', 'auth'] },
          { date: '2024-01-10', severity: 6.9, topCategories: ['api', 'db'] },
          { date: '2024-01-15', severity: 7.0, topCategories: ['db', 'auth'] },
        ],
        improvementTrend: 'stable',
        recurringIssuePatterns: ['api_timeout', 'auth_session'],
      })),

      action05_analyzeTeamPerformance: jest.fn(async () => ({
        performanceId: 'perf_20240115_001',
        teamMetrics: [
          {
            teamId: 'team_alpha',
            resolutionSpeed: 2.1,
            reportSubmissionRate: 0.88,
            issueRecurrenceRate: 0.12,
          },
          {
            teamId: 'team_beta',
            resolutionSpeed: 2.5,
            reportSubmissionRate: 0.92,
            issueRecurrenceRate: 0.08,
          },
        ],
      })),

      action06_detectDeviationFromHistoricalTrend: jest.fn(async () => ({
        deviationDetected: true,
        issueCountDeviation: {
          currentMonthAverage: 50,
          previousThreeMonthAverage: 20,
          deviationPercentage: 150,
          threshold: 15,
        },
        severityDistributionDeviation: {
          currentDistribution: {
            critical: 0.05,
            high: 0.15,
            medium: 0.65,
            low: 0.15,
          },
          historicalDistribution: {
            critical: 0.15,
            high: 0.45,
            medium: 0.25,
            low: 0.15,
          },
          isReversed: true,
          threshold: 10,
        },
        deviationSummary:
          '分析結果が過去の傾向と大きく乖離しました。過去3ヶ月平均との比較で課題件数が+150%増加、重度度分布が逆転しています。',
      })),

      action07_prepareDeliverableAndNotify: jest.fn(async () => ({
        notificationId: 'notif_20240115_001',
        status: 'pending_human_review',
        escalationTriggered: true,
      })),
    };

    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2024-01',
      teamId: 'team_operations',
      triggeredBy: 'schedule',
      includeDetailedAnalysis: true,
    };

    const auditLog: Array<{
      eventType: string;
      testId: string;
      escalationReason?: string;
      timestamp: string;
      actor: string;
      status: string;
    }> = [];

    const result = await runTx7Imp1Agent(request, mockAiClient, {
      onAuditEvent: (event) => {
        auditLog.push(event);
      },
    });

    expect(result.escalated).toBe(true);
    expect(result.escalationReason).toMatch(/分析結果が過去の傾向と大きく乖離/);
    expect(result.escalationReason).toMatch(/課題件数が\+150%増加/);
    expect(result.escalationReason).toMatch(/重度度分布が逆転/);
    expect(result.handoffTarget).toBe('department_head');
    expect(result.handoffTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(result.pendingSideEffects).toBeDefined();
    expect(Array.isArray(result.pendingSideEffects)).toBe(true);
    expect(result.pendingSideEffects.length).toBeGreaterThan(0);
    expect(result.pendingSideEffects).toContainEqual(
      expect.objectContaining({
        effectType: expect.stringMatching(
          /department_head_notification|report_persistence/
        ),
        status: 'pending',
      })
    );

    const escalationEvent = auditLog.find(
      (log) => log.eventType === 'escalation_triggered'
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.testId).toBe('SCEN-135');
    expect(escalationEvent?.escalationReason).toMatch(/分析結果が過去の傾向/);
    expect(escalationEvent?.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(escalationEvent?.actor).toBe('ai_agent_tx7_imp1');
    expect(escalationEvent?.status).toBe('awaiting_human_review');

    expect(mockAiClient.action01_collectMonthlyData).toHaveBeenCalledWith(
      request
    );
    expect(mockAiClient.action02_generateReportStructure).toHaveBeenCalled();
    expect(mockAiClient.action03_analyzeTimeSeriesChanges).toHaveBeenCalled();
    expect(mockAiClient.action04_analyzeBottleneckTrend).toHaveBeenCalled();
    expect(mockAiClient.action05_analyzeTeamPerformance).toHaveBeenCalled();
    expect(mockAiClient.action06_detectDeviationFromHistoricalTrend).toHaveBeenCalled();
    expect(mockAiClient.action07_prepareDeliverableAndNotify).toHaveBeenCalled();
  });
});

interface MonthlyReportGenerationRequest {
  targetMonth: string;
  teamId: string;
  triggeredBy: 'schedule' | 'manual';
  includeDetailedAnalysis?: boolean;
}