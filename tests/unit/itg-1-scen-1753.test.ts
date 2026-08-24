import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1753: [edge] 課題キーワード自動抽出・優先度スコア算出機能 - 優先度スコアが降順に並んでいるとき逆順入力が正しく再ソートされる
  test('should correctly re-sort keywords in ascending order when input is in descending order', async () => {
    // Arrange
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '納期遅延', frequency: 8 },
          { keyword: 'バグ対応', frequency: 5 },
          { keyword: 'リソース不足', frequency: 3 }
        ],
        totalKeywords: 3
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(95)
        .mockResolvedValueOnce(78)
        .mockResolvedValueOnce(45),
      classifyIssueSeverity: jest.fn()
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123'
    };

    // Act
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService as any
    );

    // Assert
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBe(3);

    // Verify ascending order by score
    expect(result.keywords[0].score).toBe(45);
    expect(result.keywords[0].keyword).toBe('リソース不足');
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].score).toBe(78);
    expect(result.keywords[1].keyword).toBe('バグ対応');
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].score).toBe(95);
    expect(result.keywords[2].keyword).toBe('納期遅延');
    expect(result.keywords[2].rank).toBe(3);

    // Verify scores are in ascending order
    const scores = result.keywords.map(k => k.score);
    expect(scores).toEqual([45, 78, 95]);

    // Verify metadata
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('object');
    expect(result.analysisperiodDays).toBe(7);
  });
});