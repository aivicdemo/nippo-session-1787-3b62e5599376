import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定 - 決定論性検証', () => {
  // SCEN-481: [normal] 課題自動抽出・優先度判定機能 - 同じ日報入力で2回実行した場合に同一の優先度スコアと課題順序が得られる
  test('SCEN-481: 同一の日報データで2回実行すると全く同じ抽出結果と優先度順序が得られる', async () => {
    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        // 決定論的なキーワード抽出: 入力テキストに基づいて常に同じ結果を返す
        const mockExtractedKeywords = [
          { keyword: 'データベース接続エラー', frequency: 3, impactScore: 75 },
          { keyword: 'メモリリーク', frequency: 2, impactScore: 60 },
          { keyword: 'API応答遅延', frequency: 4, impactScore: 55 },
        ];
        return mockExtractedKeywords;
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        // 決定論的なインパクトスコア: 同じキーワードには常に同じスコアを返す
        const scoreMap: { [key: string]: number } = {
          'データベース接続エラー': 75,
          'メモリリーク': 60,
          'API応答遅延': 55,
        };
        return scoreMap[keyword] ?? 50;
      }),
    };

    // テスト用日報データの準備
    const testReportData = {
      yesterdayAccomplishment: '昨日はデータベース接続エラーの調査を実施し、原因を特定した。',
      todayPlan: '本日はメモリリークの修正とAPI応答遅延の最適化を実施予定。',
      currentChallenges:
        'データベース接続エラーが引き続き発生している。メモリリークとAPI応答遅延も課題として残っている。',
    };

    const extractInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // 1回目の実行
    const firstExecutionResult: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractInput,
      mockTextAnalysisAdapter as any,
    );

    // 1回目の結果から期待値を記録
    const firstKeywords = firstExecutionResult.keywords;
    const firstTotalCount = firstExecutionResult.totalKeywordCount;
    const firstExtractedAt = firstExecutionResult.extractedAt;
    const firstAnalysisPeriodDays = firstExecutionResult.analysisperiodDays;

    // 2回目の実行（同じモック設定、同じ入力データ）
    const secondExecutionResult: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractInput,
      mockTextAnalysisAdapter as any,
    );

    // 2回目の結果を取得
    const secondKeywords = secondExecutionResult.keywords;
    const secondTotalCount = secondExecutionResult.totalKeywordCount;
    const secondAnalysisPeriodDays = secondExecutionResult.analysisperiodDays;

    // 比較検証

    // (1) 抽出された課題キーワードの集合が同一
    expect(firstKeywords.length).toBe(secondKeywords.length);
    firstKeywords.forEach((firstKeyword, index) => {
      const secondKeyword = secondKeywords[index];
      expect(firstKeyword.keyword).toBe(secondKeyword.keyword);
      expect(firstKeyword.keywordId).toBe(secondKeyword.keywordId);
    });

    // (2) 各課題キーワードのチーム波及度スコアの数値が完全に同一
    firstKeywords.forEach((firstKeyword, index) => {
      const secondKeyword = secondKeywords[index];
      expect(firstKeyword.frequency).toBe(secondKeyword.frequency);
    });

    // (3) 課題の優先度判定結果（高・中・低の分類）が同一
    firstKeywords.forEach((firstKeyword, index) => {
      const secondKeyword = secondKeywords[index];
      expect(firstKeyword.rank).toBe(secondKeyword.rank);
    });

    // (4) 優先度が同じ課題群内での順序が同一
    // rankの昇順でソートして比較
    const firstSortedByRank = [...firstKeywords].sort((a, b) => a.rank - b.rank);
    const secondSortedByRank = [...secondKeywords].sort((a, b) => a.rank - b.rank);
    firstSortedByRank.forEach((firstKeyword, index) => {
      const secondKeyword = secondSortedByRank[index];
      expect(firstKeyword.keyword).toBe(secondKeyword.keyword);
      expect(firstKeyword.rank).toBe(secondKeyword.rank);
    });

    // 全体的な集計値が同一
    expect(firstTotalCount).toBe(secondTotalCount);
    expect(firstAnalysisPeriodDays).toBe(secondAnalysisPeriodDays);

    // 期待具体値での検証
    expect(firstKeywords.length).toBe(3);
    expect(firstTotalCount).toBe(3);
    expect(firstAnalysisPeriodDays).toBe(1);

    // キーワードのランク順序が発生頻度順（高い順）であることを確認
    expect(firstKeywords[0].keyword).toBe('API応答遅延');
    expect(firstKeywords[0].frequency).toBe(4);
    expect(firstKeywords[0].rank).toBe(1);

    expect(firstKeywords[1].keyword).toBe('データベース接続エラー');
    expect(firstKeywords[1].frequency).toBe(3);
    expect(firstKeywords[1].rank).toBe(2);

    expect(firstKeywords[2].keyword).toBe('メモリリーク');
    expect(firstKeywords[2].frequency).toBe(2);
    expect(firstKeywords[2].rank).toBe(3);
  });
});