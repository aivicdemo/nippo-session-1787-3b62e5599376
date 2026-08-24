import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  test('SCEN-1202: 抽出課題の発生頻度が小数点第2位で端数が生じる場合、正しく丸められている', async () => {
    // Arrange
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'API障害',
          frequency: 3.666,
          confidence: 0.85,
        },
        {
          keyword: 'DB接続タイムアウト',
          frequency: 3.334,
          confidence: 0.82,
        },
        {
          keyword: 'メモリリーク',
          frequency: 2.5,
          confidence: 0.78,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    // Act
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Assert
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // API障害キーワードの検証
    const apiFailureKeyword = result.keywords.find(k => k.keyword === 'API障害');
    expect(apiFailureKeyword).toBeDefined();
    expect(apiFailureKeyword?.frequency).toBe(3.67);
    expect(apiFailureKeyword?.rank).toBe(1);

    // DB接続タイムアウトキーワードの検証
    const dbTimeoutKeyword = result.keywords.find(k => k.keyword === 'DB接続タイムアウト');
    expect(dbTimeoutKeyword).toBeDefined();
    expect(dbTimeoutKeyword?.frequency).toBe(3.33);
    expect(dbTimeoutKeyword?.rank).toBe(2);

    // メモリリークキーワードの検証
    const memoryLeakKeyword = result.keywords.find(k => k.keyword === 'メモリリーク');
    expect(memoryLeakKeyword).toBeDefined();
    expect(memoryLeakKeyword?.frequency).toBe(2.5);
    expect(memoryLeakKeyword?.rank).toBe(3);

    // 全体結果の検証
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);

    // ランクが降順で並んでいることを確認
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
    }
  });
});