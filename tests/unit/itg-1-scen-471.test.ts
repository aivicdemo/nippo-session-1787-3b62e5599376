import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('朝会報告管理システム - 月次分析レポート生成', () => {
  // SCEN-471: [error] プロジェクトマネージャーのメールアドレスが空または不正な形式の場合
  test('プロジェクトマネージャーのメールアドレスが空のときは例外をスロー', () => {
    const monthlyAnalysisInput = {
      aggregationPeriodStart: '2025-01-01',
      aggregationPeriodEnd: '2025-01-31',
      issueRankingData: [
        {
          issueId: 'issue-001',
          frequency: 5,
          impactScore: 75,
        },
      ],
      priorityScoreData: [
        {
          issueId: 'issue-001',
          priorityScore: 70,
          priorityRank: 'high' as const,
          colorCode: 'red' as const,
        },
      ],
      teamPerformanceMetrics: [
        {
          teamId: 'team-001',
          issueResolutionSpeedDays: 3,
          reportSubmissionRate: 90,
          issueRecurrenceRate: 15,
        },
      ],
      bottleneckProgressionData: [
        {
          issueId: 'issue-001',
          weeklyFrequencyTrend: [2, 3, 4, 5],
          progressionType: 'deteriorating' as const,
        },
      ],
    };

    const failureInput = {
      failureType: 'timeout' as const,
      retryCount: 0,
      reportGenerationTimestamp: '2025-01-15T09:00:00Z',
      pmEmail: '',
      directorEmail: 'director@example.com',
    };

    expect(() =>
      generateMonthlyAnalysisReport(monthlyAnalysisInput, failureInput)
    ).toThrow(/プロジェクトマネージャーのメールアドレス/);
  });
});