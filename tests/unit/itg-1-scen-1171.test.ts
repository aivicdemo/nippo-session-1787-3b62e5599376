import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1171
  test('信頼度が基準未満の課題キーワードが警告表示フラグ付きで返される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'データベース接続',
            frequency: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue(40),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const confidenceThreshold = 50;

    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      confidenceThreshold
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース接続');
    expect(result.keywords[0].confidenceScore).toBe(40);
    expect(result.keywords[0].shouldShowWarning).toBe(true);
    expect(result.keywords[0].warningMessage).toBe('信頼度が基準を下回っています');
  });
});