import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  test('SCEN-1633: 抽出されたキーワードの出現頻度が0のとき、処理を中止しエラーを返す', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        totalCount: 0,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      reportTexts: ['特に課題はありません'],
      teamId: 'team-001',
      analysisStartDate: new Date('2024-01-08T00:00:00Z'),
      analysisEndDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(
      async () => await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/出現頻度/);

    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});