import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-530: [error] チームメンバーの日報集約が0件（空配列）の場合、処理を中断してエラーを返す
  test('日報集約データが空配列の場合、ERR_NO_DAILY_REPORTSエラーを返す', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      dailyReports: [],
    };

    expect(() => extractAndRankIssueKeywords(input, mockTextAnalysisService)).toThrow(/ERR_NO_DAILY_REPORTS/);

    expect(mockTextAnalysisService.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisService.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisService.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});