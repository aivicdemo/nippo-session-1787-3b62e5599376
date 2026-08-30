import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import type {
  MonthlyAnalysisReportInput,
  MonthlyAnalysisReportOutput,
} from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-462: チーム対応可能タスク数がゼロまたは負の値のときエラーが発生する
  test('should throw error when team capacity is zero or negative', () => {
    const input: MonthlyAnalysisReportInput = {
      aggregationPeriodStart: '2024-01-01',
      aggregationPeriodEnd: '2024-01-31',
      issueRankingData: [
        {
          issueId: 'issue-001',
          keyword: 'ビルド失敗',
          frequency: 2,
          impactScore: 80,
        },
      ],
      priorityScoreData: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          priorityRank: 'high',
          colorCode: 'red',
        },
      ],
      teamPerformanceMetrics: [
        {
          teamId: 'team-001',
          issueResolutionSpeedDays: 5,
          reportSubmissionRate: 90,
          issueRecurrenceRate: 15,
        },
      ],
      bottleneckProgressionData: [
        {
          issueId: 'issue-001',
          progressionType: 'deteriorating',
          weeklyFrequencyTrend: [1, 1, 2, 2],
          category: 'technical',
        },
      ],
      teamCapacity: 0,
      projectDeadline: new Date('2024-02-15'),
      riskThresholds: {
        high: 80,
        medium: 50,
      },
    };

    expect(() => generateMonthlyAnalysisReport(input)).toThrow(
      /チーム容量/
    );
  });
});