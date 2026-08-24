import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1655: [edge] 課題キーワード自動抽出機能 - 同一キーワードが複数の日報に重複出現する場合、発生頻度が正しく累算される
  test('同一キーワードが複数の日報に出現する場合、発生頻度が累算される', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-10T23:59:59Z');
    const requestUserId = 'user-director-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: async (text: string) => {
        if (text.includes('データベース接続エラーの調査')) {
          return [
            { keyword: 'データベース接続エラー', frequency: 1 },
          ];
        }
        if (text.includes('データベース接続エラーの修正とデータベース接続エラーのテスト')) {
          return [
            { keyword: 'データベース接続エラー', frequency: 2 },
          ];
        }
        if (text.includes('データベース接続エラーが本番環境で頻発')) {
          return [
            { keyword: 'データベース接続エラー', frequency: 1 },
          ];
        }
        return [];
      },
    };

    const reportingTexts = [
      '昨日やったこと: データベース接続エラーの調査',
      '今日やること: データベース接続エラーの修正とデータベース接続エラーのテスト',
      '抱えている課題: データベース接続エラーが本番環境で頻発',
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    const databaseErrorKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース接続エラー'
    );

    expect(databaseErrorKeyword).toBeDefined();
    expect(databaseErrorKeyword?.frequency).toBe(4);
    expect(databaseErrorKeyword?.rank).toBe(1);

    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.keywords.every((kw, idx, arr) =>
      idx === 0 || kw.frequency <= arr[idx - 1].frequency
    )).toBe(true);
  });
});