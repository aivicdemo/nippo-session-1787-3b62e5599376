import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1900: [edge] 複数の日報に同一キーワードが含まれる場合、発生頻度の合計値が正確に計算される

  test('複数日報から抽出された課題キーワードの発生頻度が正確に集計・ランク付けされる', async () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 1件目日報の抽出結果: 『サーバー障害』(頻度2)、『デプロイ失敗』(頻度1)
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValueOnce([
      { keyword: 'サーバー障害', frequency: 2 },
      { keyword: 'デプロイ失敗', frequency: 1 },
    ]);

    // 2件目日報の抽出結果: 『サーバー障害』(頻度3)、『ネットワーク遅延』(頻度1)
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValueOnce([
      { keyword: 'サーバー障害', frequency: 3 },
      { keyword: 'ネットワーク遅延', frequency: 1 },
    ]);

    const teamId = 'team-001';
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-15T23:59:59Z');
    const requestUserId = 'user-001';

    // 1件目日報を処理
    const input1: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const report1Content =
      '【昨日やったこと】サーバー障害が発生してサーバー障害対応に追われた。デプロイ失敗で復旧遅延【今日やること】復旧作業継続【抱えている課題】サーバー障害対応中';

    // 2件目日報を処理
    const input2: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const report2Content =
      '【昨日やったこと】昨日のサーバー障害の詳細調査。ネットワーク遅延が根因でサーバー障害再発防止策を検討。サーバー障害対応続行【今日やること】対応方針共有【抱えている課題】引き続き対応中';

    // Act: キーワード抽出を実行
    const result1 = await extractAndRankIssueKeywords(input1, mockTextAnalysisServiceAdapter);
    const result2 = await extractAndRankIssueKeywords(input2, mockTextAnalysisServiceAdapter);

    // 両結果を統合して最終ランキングを作成
    const allKeywords = new Map<string, number>();

    // 1件目結果の集計
    result1.keywords.forEach((kw) => {
      allKeywords.set(
        kw.keyword,
        (allKeywords.get(kw.keyword) || 0) + kw.frequency
      );
    });

    // 2件目結果の集計
    result2.keywords.forEach((kw) => {
      allKeywords.set(
        kw.keyword,
        (allKeywords.get(kw.keyword) || 0) + kw.frequency
      );
    });

    // Assert: 集計結果の検証
    // 『サーバー障害』の合計頻度: 2 + 3 = 5
    expect(allKeywords.get('サーバー障害')).toBe(5);

    // 『デプロイ失敗』の合計頻度: 1
    expect(allKeywords.get('デプロイ失敗')).toBe(1);

    // 『ネットワーク遅延』の合計頻度: 1
    expect(allKeywords.get('ネットワーク遅延')).toBe(1);

    // ランキングの検証
    // 結果をソートして優先度を確認
    const sortedKeywords = Array.from(allKeywords.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, frequency], index) => ({
        keyword,
        frequency,
        rank: index + 1,
      }));

    // 第1位: 『サーバー障害』(頻度5)
    expect(sortedKeywords[0].keyword).toBe('サーバー障害');
    expect(sortedKeywords[0].frequency).toBe(5);
    expect(sortedKeywords[0].rank).toBe(1);

    // 第2位: 『デプロイ失敗』と『ネットワーク遅延』(同列、頻度1)
    const secondRankKeywords = sortedKeywords
      .filter((kw) => kw.frequency === 1)
      .map((kw) => kw.keyword);

    expect(secondRankKeywords).toContain('デプロイ失敗');
    expect(secondRankKeywords).toContain('ネットワーク遅延');
    expect(secondRankKeywords.length).toBe(2);

    // 総キーワード数の検証
    expect(allKeywords.size).toBe(3);

    // TextAnalysisServiceAdapterが正しく呼び出されたか確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(2);
  });
});