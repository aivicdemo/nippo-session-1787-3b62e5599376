import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1138
  test('出現頻度が欠落しているデータがあるとき検証エラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: '納期が厳しい',
            // 出現頻度フィールド欠落
          },
          {
            keyword: 'バグ対応',
            frequency: 2,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(async () => {
      await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);
    }).rejects.toThrow(/出現頻度/);
  });
});