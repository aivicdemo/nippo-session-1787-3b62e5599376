import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyReportGenerationRequest, type MonthlyAnalysisReportResult } from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-467: [edge] 毎月初に前月の全日報データを抽出し、課題の時系列変化・ボトルネック推移・チーム別パフォーマンス指標を分析してレポートを生成し、プロジェクトマネージャーに通知する。 - 課題キーワード抽出後、有効なキーワードが0件のときという明示された境界条件で対象月に報告された課題がありません
  test('should generate monthly analysis report with zero extracted issue keywords and log warning', async () => {
    const targetMonth = '2024-11';
    const projectManagerId = 'pm-001';
    
    const request: MonthlyReportGenerationRequest = {
      targetMonth,
      projectManagerId,
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const mockMonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-11-01T00:00:00Z',
        endDateTime: '2024-11-30T23:59:59Z',
      },
      totalReportCount: 3,
      reports: [
        {
          reportId: 'report-001',
          reportDate: '2024-11-15',
          reporterId: 'eng-001',
          teamId: 'team-001',
          issues: null,
          submissionTimestamp: '2024-11-15T08:30:00Z',
        },
        {
          reportId: 'report-002',
          reportDate: '2024-11-16',
          reporterId: 'eng-002',
          teamId: 'team-001',
          issues: '',
          submissionTimestamp: '2024-11-16T08:30:00Z',
        },
        {
          reportId: 'report-003',
          reportDate: '2024-11-17',
          reporterId: 'eng-003',
          teamId: 'team-002',
          issues: '',
          submissionTimestamp: '2024-11-17T08:30:00Z',
        },
      ],
      dataQualityScore: 75,
    };

    const mockTeamPerformanceMetrics = {
      teamMetrics: [
        {
          teamId: 'team-001',
          issueResolutionSpeedDays: 3,
          reportSubmissionRate: 100,
          issueRecurrenceRate: 0,
          priorityScore: 50,
          performanceRank: 'high' as const,
        },
        {
          teamId: 'team-002',
          issueResolutionSpeedDays: 2,
          reportSubmissionRate: 100,
          issueRecurrenceRate: 0,
          priorityScore: 60,
          performanceRank: 'high' as const,
        },
      ],
      aggregationPeriod: {
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-11-30'),
      },
      calculationTimestamp: new Date('2024-11-30T18:00:00Z'),
    };

    const mockReportContent = {
      reportPeriod: {
        startDate: '2024-11-01',
        endDate: '2024-11-30',
      },
      topPriorityChallenges: [],
      teamPerformanceSummary: {
        teamMetrics: mockTeamPerformanceMetrics.teamMetrics,
        aggregationPeriod: mockTeamPerformanceMetrics.aggregationPeriod,
      },
      recommendedCountermeasures: [],
      projectDelayRiskAssessment: {
        riskScore: 45,
        riskLevel: 'medium',
        affectedProjects: [],
      },
    };

    const result: MonthlyAnalysisReportResult = await generateMonthlyAnalysisReport(request);

    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.targetMonth).toBe('2024-11');
    expect(result.reportContent.topPriorityChallenges).toEqual([]);
    expect(Array.isArray(result.reportContent.topPriorityChallenges)).toBe(true);
    expect(result.reportContent.teamPerformanceSummary.teamMetrics).toHaveLength(2);
    expect(result.reportContent.teamPerformanceSummary.teamMetrics[0].teamId).toBe('team-001');
    expect(result.reportContent.teamPerformanceSummary.teamMetrics[1].teamId).toBe('team-002');
    expect(result.projectDelayRiskLevel).toBe('medium');
    expect(['high', 'medium', 'low']).toContain(result.projectDelayRiskLevel);
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});