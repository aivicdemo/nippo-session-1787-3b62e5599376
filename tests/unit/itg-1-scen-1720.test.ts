import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1720
  test('対象期間の開始日が無効な日付形式のとき集約処理がエラーになる', () => {
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidStartDates = [
      '2026-13-45',
      '2026/13/45',
      'invalid-date',
      '',
      'not-a-date',
      '2026-02-30',
    ];

    invalidStartDates.forEach((invalidStartDate) => {
      const input: ExtractIssueKeywordsInput = {
        teamId: 'team-001',
        startDate: new Date(invalidStartDate),
        endDate: new Date('2026-01-31T23:59:59Z'),
        minFrequencyThreshold: 1,
        requestUserId: 'user-001',
      };

      expect(() =>
        extractAndRankIssueKeywords(input, textAnalysisServiceAdapterStub),
      ).toThrow(/対象期間の開始日/);
    });

    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
  });
});