import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1581
  test('発生頻度が0の課題キーワードが検出された場合、エラーをスローすること', () => {
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: '要件定義の遅延',
          occurrenceCount: 0,
          impactScore: 75,
        },
        {
          issueKeyword: 'テスト環境不具合',
          occurrenceCount: 5,
          impactScore: 60,
        },
      ],
      teamId: 'team-001',
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/発生頻度/);
  });
});