import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-884
  test('異なるキーワードが同じ発生頻度を持つとき、順序が安定的に保たれる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(() => ({
        keywords: [
          { keyword: 'サーバー障害', frequency: 3 },
          { keyword: '納期遅延', frequency: 3 },
          { keyword: '人員不足', frequency: 3 },
        ],
      })),
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

    const reportText = 'サーバー障害が発生。納期遅延のリスクあり。人員不足で対応困難';

    const results: string[][] = [];

    for (let i = 0; i < 6; i++) {
      const result = extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

      const keywordOrder = result.keywords.map(
        (k: { keyword: string; frequency: number; rank: number }) => k.keyword
      );
      results.push(keywordOrder);
    }

    const firstResult = results[0];
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(firstResult);
    }

    expect(firstResult).toHaveLength(3);
    expect(firstResult[0]).toBe('サーバー障害');
    expect(firstResult[1]).toBe('納期遅延');
    expect(firstResult[2]).toBe('人員不足');

    const rankedResult = results[0];
    expect(rankedResult).toEqual(['サーバー障害', '納期遅延', '人員不足']);
  });
});