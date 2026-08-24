import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1490
  test('対象期間の開始日が無効な日付形式のとき、エラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
    };

    const invalidInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-13-45'),
      endDate: new Date('2026-12-31'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(() =>
      extractAndRankIssueKeywords(invalidInput, mockTextAnalysisServiceAdapter)
    ).toThrow(/開始日/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});