import { generateWeeklyAnalysisReport, type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1583
  test('projectManagerIdがnullの場合、ValidationErrorが発生する', () => {
    const invalidInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'DB接続エラー',
          occurrenceCount: 3,
          impactScore: 85,
        },
      ],
      teamId: 'team-001',
    };

    // projectManagerIdをnullとして渡す（型安全性を無視してテスト）
    const inputWithNullProjectManagerId = {
      ...invalidInput,
      projectManagerId: null,
    } as unknown as WeeklyAnalysisReportInput;

    expect(() => generateWeeklyAnalysisReport(inputWithNullProjectManagerId)).toThrow(
      /ProjectManagerId/,
    );
  });
});