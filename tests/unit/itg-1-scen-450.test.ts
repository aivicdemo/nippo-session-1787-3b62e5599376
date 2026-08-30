import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-450: 優先度スコアが0～100の範囲外になるときは正規化される
  test('should normalize priority score to 0-100 range when calculated value is out of bounds', async () => {
    // テストダブル設定：チーム別パフォーマンス計算をモック化
    const mockTeamPerformanceMetrics = [
      {
        teamId: 'team-001',
        issueResolutionSpeedDays: 15,
        reportSubmissionRate: 50,
        issueRecurrenceRate: 80,
        priorityScore: -50, // 範囲外の負数値を意図的に設定
        performanceRank: 'low' as const,
      },
      {
        teamId: 'team-002',
        issueResolutionSpeedDays: 3,
        reportSubmissionRate: 95,
        issueRecurrenceRate: 10,
        priorityScore: 150, // 範囲外の超過値を意図的に設定
        performanceRank: 'high' as const,
      },
    ];

    const mockMonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z',
      },
      totalReportCount: 3,
      reports: [
        {
          reportId: 'report-001',
          reportDate: '2024-01-15',
          reporterId: 'eng-001',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-001',
              issueContent: 'Build failed',
              frequency: 2,
              impactScore: 45,
              resolutionStatus: 'unresolved' as const,
              extractedDate: new Date('2024-01-15T09:00:00Z'),
            },
          ],
          submissionTimestamp: '2024-01-15T09:30:00Z',
        },
        {
          reportId: 'report-002',
          reportDate: '2024-01-16',
          reporterId: 'eng-002',
          teamId: 'team-002',
          issues: [
            {
              issueId: 'issue-002',
              issueContent: 'Test environment unstable',
              frequency: 3,
              impactScore: 60,
              resolutionStatus: 'in_progress' as const,
              extractedDate: new Date('2024-01-16T10:00:00Z'),
            },
          ],
          submissionTimestamp: '2024-01-16T10:15:00Z',
        },
        {
          reportId: 'report-003',
          reportDate: '2024-01-17',
          reporterId: 'eng-003',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-003',
              issueContent: 'Resource shortage',
              frequency: 1,
              impactScore: 55,
              resolutionStatus: 'resolved' as const,
              extractedDate: new Date('2024-01-17T11:00:00Z'),
            },
          ],
          submissionTimestamp: '2024-01-17T11:45:00Z',
        },
      ],
      dataQualityScore: 85,
    };

    const mockIssueTimeSeriesAnalysisResult = {
      issueTimeSeriesData: [
        {
          issueId: 'issue-001',
          issueContent: 'Build failed',
          frequencyTrend: [
            { date: new Date('2024-01-08'), frequency: 1 },
            { date: new Date('2024-01-15'), frequency: 2 },
            { date: new Date('2024-01-22'), frequency: 2 },
            { date: new Date('2024-01-29'), frequency: 1 },
          ],
          impactTrend: [
            { date: new Date('2024-01-08'), impactScore: 40 },
            { date: new Date('2024-01-15'), impactScore: 45 },
            { date: new Date('2024-01-22'), impactScore: 45 },
            { date: new Date('2024-01-29'), impactScore: 40 },
          ],
          resolutionStatusTimeline: [
            { date: new Date('2024-01-08'), status: 'unresolved' as const },
            { date: new Date('2024-01-15'), status: 'unresolved' as const },
            { date: new Date('2024-01-22'), status: 'in_progress' as const },
            { date: new Date('2024-01-29'), status: 'in_progress' as const },
          ],
        },
      ],
      bottleneckSeverityRanking: [
        {
          issueId: 'issue-001',
          severityRank: 'high' as const,
          severityScore: 75,
          justification: 'Build failures occurring regularly with high team impact',
        },
      ],
      improvementTrendAnalysis: [
        {
          issueId: 'issue-001',
          trendDirection: 'stable' as const,
          improvementRate: 0,
          daysToResolution: 14,
        },
      ],
    };

    const mockBottleneckProgressionResult = {
      progressionPatterns: [
        {
          issueId: 'issue-001',
          progressionType: 'stable' as const,
          weeklyFrequencyTrend: [1, 2, 2, 1],
          category: 'technical',
        },
      ],
      criticalBottlenecks: [],
      resolvedBottlenecks: [],
      emergingBottlenecks: [],
    };

    const inputRequest = {
      targetMonth: '2024-01',
      projectManagerId: 'pm-001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const result = await generateMonthlyAnalysisReport(
      inputRequest,
      mockMonthlyReportDataset,
      mockIssueTimeSeriesAnalysisResult,
      mockBottleneckProgressionResult,
      mockTeamPerformanceMetrics
    );

    // 検証：チーム別メトリクスの優先度スコアが0～100の範囲に正規化されていること
    expect(result.reportContent.teamPerformanceMetrics).toBeDefined();
    expect(result.reportContent.teamPerformanceMetrics.length).toBe(2);

    // team-001: 元の -50 が 0 に正規化されることを確認
    const team001Metric = result.reportContent.teamPerformanceMetrics.find(
      (m) => m.teamId === 'team-001'
    );
    expect(team001Metric).toBeDefined();
    expect(team001Metric?.priorityScore).toBe(0); // -50 がクランプされて 0 になる

    // team-002: 元の 150 が 100 に正規化されることを確認
    const team002Metric = result.reportContent.teamPerformanceMetrics.find(
      (m) => m.teamId === 'team-002'
    );
    expect(team002Metric).toBeDefined();
    expect(team002Metric?.priorityScore).toBe(100); // 150 がクランプされて 100 になる

    // レポート全体の構造が正常に生成されていることを確認
    expect(result.reportId).toBeDefined();
    expect(result.targetMonth).toBe('2024-01');
    expect(result.reportContent).toBeDefined();
    expect(result.reportContent.issueTrendAnalysis).toBeDefined();
    expect(result.reportContent.bottleneckProgression).toBeDefined();
    expect(result.reportContent.topPriorityChallenges).toBeDefined();
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(['high', 'medium', 'low']).toContain(result.projectDelayRiskLevel);
  });
});