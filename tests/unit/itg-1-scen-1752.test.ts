import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-1752: [edge] 課題キーワード自動抽出・優先度スコア算出機能 - 複数キーワードが同じ優先度スコアを持つとき、同値のまま並序される
  test('should preserve input order when multiple keywords have equal priority scores', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: async (text: string) => {
        return [
          { keyword: 'データベース障害', frequency: 1 },
          { keyword: 'API連携遅延', frequency: 1 },
          { keyword: '認証エラー', frequency: 1 },
        ];
      },
      assessImpactScore: async (keyword: string) => {
        return 50;
      },
      classifyIssueSeverity: async (text: string) => {
        return 'medium';
      },
    };

    const inputText = '昨日データベース障害とAPI連携遅延が発生。今日は認証エラー対応を予定';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-15T23:59:59Z');
    const requestUserId = 'user-001';

    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId,
      },
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe('データベース障害');
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].keyword).toBe('API連携遅延');
    expect(result.keywords[1].frequency).toBe(1);
    expect(result.keywords[1].rank).toBe(1);
    expect(result.keywords[2].keyword).toBe('認証エラー');
    expect(result.keywords[2].frequency).toBe(1);
    expect(result.keywords[2].rank).toBe(1);
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toEqual(expect.any(Date));
    expect(result.analysisperiodDays).toBe(1);
  });
});