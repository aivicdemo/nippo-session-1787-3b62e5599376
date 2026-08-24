import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-1338: [edge] 課題キーワード自動抽出機能 - 課題キーワード発生頻度が閾値超過（例：6回）で上位ランクに分類される
  test('should extract and rank issue keywords with frequency threshold exceeded', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'DB接続エラー', frequency: 6 },
          { keyword: 'ネットワーク遅延', frequency: 2 },
          { keyword: 'メモリリーク', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue(85),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const testInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001'
    };

    // Act: extractAndRankIssueKeywords を呼び出す
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      testInput,
      stubTextAnalysisAdapter
    );

    // Assert: 期待結果を検証
    // 1. 抽出されたキーワード数が正しいこと
    expect(result.keywords).toHaveLength(3);

    // 2. 発生頻度が6回の「DB接続エラー」が最上位（rank: 1）にランク付けされていること
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'DB接続エラー',
      frequency: 6,
      rank: 1
    });

    // 3. 発生頻度順に降順でランク付けされていること
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(result.keywords[1].frequency);
    expect(result.keywords[1].frequency).toBeGreaterThanOrEqual(result.keywords[2].frequency);

    // 4. 総キーワード数（フィルタ前）が記録されていること
    expect(result.totalKeywordCount).toBe(3);

    // 5. 抽出実行時刻が ISO 8601 形式で記録されていること
    expect(result.extractedAt).toEqual(expect.any(Date));

    // 6. 分析対象期間が正しく計算されていること（1月8日00:00 ～ 1月14日23:59:59 = 7日間）
    expect(result.analysisperiodDays).toBe(7);

    // 7. TextAnalysisServiceAdapter の extractKeywords が呼び出されたこと
    expect(stubTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // 8. 各キーワードに重複のないランク値が割り当てられていること
    const rankValues = result.keywords.map(k => k.rank);
    const uniqueRankValues = new Set(rankValues);
    expect(uniqueRankValues.size).toBe(rankValues.length);
  });
});