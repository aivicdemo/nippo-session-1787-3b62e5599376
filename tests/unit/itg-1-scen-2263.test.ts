import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワードの抽出とランク付け', () => {
  test('SCEN-2263: 完全に同一の課題テキストが重複している場合、1件に正規化される', async () => {
    // Arrange: TextAnalysisServiceAdapter のモック
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続タイムアウトの問題が発生している',
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2026-08-20T00:00:00Z'),
      endDate: new Date('2026-08-20T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // Act: 関数を実行
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Assert: 期待結果を検証
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース接続タイムアウトの問題が発生している',
      frequency: 3,
      rank: 1,
    });
    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});