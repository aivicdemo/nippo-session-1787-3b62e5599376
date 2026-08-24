import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

// Mock interface for TextAnalysisServiceAdapter
interface TextAnalysisServiceAdapter {
  extractKeywords: (text: string) => Promise<Record<string, number>>;
}

describe('extractAndRankIssueKeywords', () => {
  // SCEN-2750
  test('[normal] 課題キーワード自動抽出機能 - TextAnalysisServiceAdapter.extractKeywordsが正常応答した場合に出現頻度データが返却される', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを作成
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: async (text: string): Promise<Record<string, number>> => {
        // スタブの戻り値として出現頻度データを設定
        return {
          'システム障害': 3,
          'システム障害への対応': 2,
          'システム障害の原因調査': 1,
        };
      },
    };

    // 日報テキスト例
    const reportText =
      'システム障害が発生した。システム障害への対応が必要。システム障害の原因調査を進める。';

    // 入力データ
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act: extractAndRankIssueKeywordsを呼び出し
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any
    );

    // Assert: 戻り値を検証
    // 1. 戻り値の型がRankedIssueKeywordListであること
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 2. keywordsの配列長が3であること（スタブで3つのキーワードを返却）
    expect(result.keywords.length).toBe(3);

    // 3. 出現頻度でソートされていることを確認（降順）
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[2].frequency).toBe(1);

    // 4. ランクが正しく付与されていること
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[2].rank).toBe(3);

    // 5. キーワード内容が正確に含まれていること
    expect(result.keywords[0].keyword).toBe('システム障害');
    expect(result.keywords[1].keyword).toBe('システム障害への対応');
    expect(result.keywords[2].keyword).toBe('システム障害の原因調査');

    // 6. 各キーワードにkeywordIdが付与されていること
    expect(result.keywords[0].keywordId).toBeDefined();
    expect(typeof result.keywords[0].keywordId).toBe('string');

    // 7. totalKeywordCountが3であること
    expect(result.totalKeywordCount).toBe(3);

    // 8. extractedAtが日付型であること
    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);

    // 9. analysisperiodDaysが7であること（2024-01-01から2024-01-07までの7日間）
    expect(result.analysisperiodDays).toBe(7);
  });
});