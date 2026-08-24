import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation - Empty Issue Ranking Error Handling', () => {
  // SCEN-1567: [error] 週次課題傾向レポート生成機能 - 課題ランキングデータが空配列のときエラーになる
  test('should throw error with appropriate message when issue ranking data is empty array', () => {
    const reportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [],
      teamId: 'team-001'
    };

    expect(() => {
      generateWeeklyAnalysisReport(reportInput);
    }).toThrow(/課題ランキング/);
  });
});