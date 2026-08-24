import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1571
  test('推奨対策データが空配列のときエラーをスロー', () => {
    const testInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: '2024-01-07',
      extractedIssues: [
        {
          issueKeyword: 'ビルドエラー',
          occurrenceCount: 3,
          impactScore: 75
        },
        {
          issueKeyword: 'テストケース不足',
          occurrenceCount: 2,
          impactScore: 60
        }
      ],
      teamId: 'team-001'
    };

    expect(() => {
      generateWeeklyAnalysisReport(testInput);
    }).toThrow(/推奨対策/);
  });
});