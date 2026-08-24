import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成 - 優先度スコア範囲検証', () => {
  // SCEN-1580
  test('優先度スコアが100を超える場合はValidationErrorをスローする', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース遅延', frequency: 3 },
          { keyword: 'APIタイムアウト', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const inputData: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-15',
      aggregationEndDate: '2024-01-21',
      extractedIssues: [
        {
          issueKeyword: 'データベース遅延',
          occurrenceCount: 3,
          description: 'クエリ実行時間が増加',
        },
        {
          issueKeyword: 'APIタイムアウト',
          occurrenceCount: 2,
          description: '外部API呼び出しの応答遅延',
        },
      ],
      teamId: 'team-001',
    };

    expect(() =>
      generateWeeklyAnalysisReport(inputData, mockTextAnalysisAdapter)
    ).toThrow(/優先度スコア/);
  });
});