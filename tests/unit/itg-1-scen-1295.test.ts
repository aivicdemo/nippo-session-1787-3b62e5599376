import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-1295: [normal] 課題キーワード自動抽出機能 - 同一入力で2回実行しても同じキーワード抽出結果が得られる
  test('should return identical keyword extraction results when called twice with same input', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        return [
          { keyword: 'タイムアウト', frequency: 1 },
          { keyword: '機能', frequency: 2 },
          { keyword: 'データベース', frequency: 1 },
        ];
      }),
      assessImpactScore: jest.fn(async () => 75),
      classifyIssueSeverity: jest.fn(async () => 'high'),
    };

    const testInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const mockReportTexts = [
      '昨日は機能A開発、今日は機能B開発、課題：データベース接続タイムアウト',
    ];

    // 1回目の実行
    const result1: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      testInput,
      mockTextAnalysisAdapter
    );

    // 2回目の実行
    const result2: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      testInput,
      mockTextAnalysisAdapter
    );

    // 抽出キーワード一覧を比較検証
    expect(result1.keywords).toHaveLength(3);
    expect(result2.keywords).toHaveLength(3);

    // キーワードの内容と順序を検証
    expect(result1.keywords[0].keyword).toBe(result2.keywords[0].keyword);
    expect(result1.keywords[0].keyword).toBe('機能');
    expect(result1.keywords[1].keyword).toBe(result2.keywords[1].keyword);
    expect(result1.keywords[2].keyword).toBe(result2.keywords[2].keyword);

    // 各キーワードの出現頻度を検証
    expect(result1.keywords[0].frequency).toBe(result2.keywords[0].frequency);
    expect(result1.keywords[0].frequency).toBe(2);

    expect(result1.keywords[1].frequency).toBe(result2.keywords[1].frequency);
    expect(result1.keywords[1].frequency).toBe(1);

    expect(result1.keywords[2].frequency).toBe(result2.keywords[2].frequency);
    expect(result1.keywords[2].frequency).toBe(1);

    // ランク付けが同一であることを検証
    expect(result1.keywords[0].rank).toBe(result2.keywords[0].rank);
    expect(result1.keywords[0].rank).toBe(1);

    expect(result1.keywords[1].rank).toBe(result2.keywords[1].rank);
    expect(result1.keywords[2].rank).toBe(result2.keywords[2].rank);

    // 全体の統計が一致することを検証
    expect(result1.totalKeywordCount).toBe(result2.totalKeywordCount);
    expect(result1.analysisperiodDays).toBe(result2.analysisperiodDays);
    expect(result1.analysisperiodDays).toBe(7);
  });
});