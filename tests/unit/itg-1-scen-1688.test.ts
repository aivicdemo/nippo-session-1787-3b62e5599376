import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成', () => {
  // SCEN-1688: [error] 週次課題傾向分析レポート生成 - 日報データ集合が空配列のとき分析を中止し警告を返す
  test('日報データが空配列の場合、分析を中止してERRORステータスを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [],
      teamId: 'team-001',
    };

    const result = generateWeeklyAnalysisReport(input, mockTextAnalysisServiceAdapter);

    expect(result).toEqual({
      status: 'ERROR',
      message: '日報データが存在しません。分析対象期間のデータを確認してください',
      analysisResult: null,
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});