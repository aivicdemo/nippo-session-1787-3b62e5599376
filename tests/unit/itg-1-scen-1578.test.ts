import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1578
  test('推奨対策に必須フィールド（対策内容）が欠落しているときエラーになる', () => {
    const analysisInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          keyword: 'データベース接続エラー',
          occurrenceFrequency: 3,
          impactDegree: 85,
        },
        {
          keyword: 'API タイムアウト',
          occurrenceFrequency: 2,
          impactDegree: 70,
        },
      ],
      teamId: 'team-001',
    };

    expect(() => generateWeeklyAnalysisReport(analysisInput)).toThrow(/対策内容/);
  });
});