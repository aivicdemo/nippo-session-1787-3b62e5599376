import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1901: [edge] 抽出結果に同じ発生頻度を持つキーワードが複数含まれる場合、それらが並列して表示される
  test('同一頻度の複数キーワードが並列表示される', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '障害A', frequency: 3 },
        { keyword: '遅延', frequency: 3 },
        { keyword: 'DB接続', frequency: 3 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    expect(result).resolves.toBeDefined();
    expect(result).resolves.toMatchObject({
      keywords: expect.arrayContaining([
        expect.objectContaining({
          keyword: '障害A',
          frequency: 3,
          rank: 1,
        }),
        expect.objectContaining({
          keyword: '遅延',
          frequency: 3,
          rank: 1,
        }),
        expect.objectContaining({
          keyword: 'DB接続',
          frequency: 3,
          rank: 1,
        }),
      ]),
      totalKeywordCount: 3,
      extractedAt: expect.any(Date),
      analysisPeriodDays: 7,
    });

    result.then((resolvedResult) => {
      const keyword_障害A = resolvedResult.keywords.find(
        (k) => k.keyword === '障害A'
      );
      const keyword_遅延 = resolvedResult.keywords.find(
        (k) => k.keyword === '遅延'
      );
      const keyword_DB接続 = resolvedResult.keywords.find(
        (k) => k.keyword === 'DB接続'
      );

      expect(keyword_障害A?.frequency).toBe(3);
      expect(keyword_遅延?.frequency).toBe(3);
      expect(keyword_DB接続?.frequency).toBe(3);

      expect(keyword_障害A?.rank).toBe(1);
      expect(keyword_遅延?.rank).toBe(1);
      expect(keyword_DB接続?.rank).toBe(1);
    });
  });
});