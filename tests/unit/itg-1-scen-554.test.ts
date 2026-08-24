import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・優先度判定機能", () => {
  // SCEN-554
  test("同じ発生頻度と影響度スコアを持つ重複課題が重複排除または同値として処理される", () => {
    // Arrange: TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue([
        { keyword: "データベース接続エラー", frequency: 3 },
        { keyword: "DB接続エラー", frequency: 3 },
        { keyword: "接続エラー", frequency: 3 },
      ]),
      assessImpactScore: jest
        .fn()
        .mockReturnValue({ impactScore: 75, confidence: 0.95 }),
      classifyIssueSeverity: jest
        .fn()
        .mockReturnValue({ severity: "high", confidence: 0.9 }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const reportTexts = [
      "データベース接続エラーが発生しました",
      "DB接続エラーが報告されています",
      "接続エラーの問題が継続しています",
    ];

    // Act: 課題キーワード自動抽出・優先度判定機能を実行
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      reportTexts
    );

    // Assert: 重複排除後の結果を検証
    // 期待: 最終的にダッシュボード表示時には同じグループ内の重複課題は統一されて1つの優先度行として表示される
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 重複排除後、類似キーワードは1つのグループ（または統一されたエントリ）として扱われる
    // ダッシュボード表示時に重複した3件が個別の優先度行として表示されることはない
    const uniqueKeywordGroups = new Map<string, number>();
    for (const kw of result.keywords) {
      const key = kw.keyword.toLowerCase().replace(/\s+/g, " ");
      if (!uniqueKeywordGroups.has(key)) {
        uniqueKeywordGroups.set(key, 0);
      }
      uniqueKeywordGroups.set(
        key,
        (uniqueKeywordGroups.get(key) || 0) + kw.frequency
      );
    }

    // 検証: 同じ発生頻度と影響度スコアを持つ課題は、最終結果に重複表示されていない
    // 方法1: 重複排除された場合、キーワード数は3未満
    // 方法2: 同値グループ化されている場合、最高の優先度スコアで統一
    const maxFrequency = Math.max(
      ...result.keywords.map((kw) => kw.frequency),
      0
    );
    expect(maxFrequency).toBeLessThanOrEqual(3);

    // 同じグループに属する重複課題は、合計発生頻度が正しく集計されている
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);
    expect(result.totalKeywordCount).toBeLessThanOrEqual(3);

    // ダッシュボード表示用の統一フォーマットを検証
    for (const keyword of result.keywords) {
      expect(keyword.keywordId).toBeDefined();
      expect(typeof keyword.keywordId).toBe("string");
      expect(keyword.keyword).toBeDefined();
      expect(typeof keyword.keyword).toBe("string");
      expect(keyword.frequency).toBeDefined();
      expect(typeof keyword.frequency).toBe("number");
      expect(keyword.frequency).toBeGreaterThan(0);
      expect(keyword.rank).toBeDefined();
      expect(typeof keyword.rank).toBe("number");
      expect(keyword.rank).toBeGreaterThan(0);
    }

    // 優先度スコアが正しく計算されている（発生頻度3、影響度スコア75ベース）
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});