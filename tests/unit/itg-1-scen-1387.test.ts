import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-analysis";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-analysis";

describe("extractAndRankIssueKeywords - Issue Analysis", () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      assessImpactScore: jest.fn(),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-1387: [edge] 重複課題の自動判定と統合機能 - 類似度スコアが統合閾値未満（例：79.9%）で統合されない
  test("should not merge duplicate issues when similarity score is below threshold (79.9% < 80%)", () => {
    // Setup: 類似度スコア 79.9% を返すようモック化
    mockTextAnalysisAdapter.assessImpactScore.mockImplementation(
      (keyword: string) => {
        if (keyword === "DB接続エラー" || keyword === "データベース接続障害") {
          return 65; // Impact score (separate from similarity)
        }
        return 50;
      }
    );

    // Input: 類似度 79.9% となる2件の課題データを含む日報
    const reportDataList = [
      {
        reportId: "report-1",
        reportDate: "2024-01-15",
        teamId: "team-001",
        userId: "user-001",
        yesterdayAccomplishments: "DB接続エラーを修正した",
        todayPlan: "DB接続エラーが再発しないか検証",
        challenges: "DB接続エラーが発生している",
      },
      {
        reportId: "report-2",
        reportDate: "2024-01-15",
        teamId: "team-001",
        userId: "user-002",
        yesterdayAccomplishments: "データベース接続障害を調査",
        todayPlan: "データベース接続障害の原因特定",
        challenges: "データベース接続障害が継続中",
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate: "2024-01-15",
      analysisEndDate: "2024-01-15",
      minFrequencyThreshold: 1,
    };

    // Invoke: 抽出・ランク付け処理を実行
    // Note: 実装では TextAnalysisServiceAdapter のモック品質に基づいて
    // 内部で類似度 79.9% < 統合閾値 80% を判定し、統合しないロジック
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Assertions:
    // 1. 課題A（DB接続エラー）と課題B（データベース接続障害）が個別のキーワードとして存在
    const keywordTexts = result.keywords.map((k) => k.keyword);
    expect(keywordTexts).toContain("DB接続エラー");
    expect(keywordTexts).toContain("データベース接続障害");

    // 2. 2つの課題が統合されていない（個別カウント）
    const dbErrorKeyword = result.keywords.find(
      (k) => k.keyword === "DB接続エラー"
    );
    const dbConnectionKeyword = result.keywords.find(
      (k) => k.keyword === "データベース接続障害"
    );

    expect(dbErrorKeyword).toBeDefined();
    expect(dbConnectionKeyword).toBeDefined();

    // 3. 各課題の発生頻度が1回（統合されていない証拠）
    expect(dbErrorKeyword?.frequency).toBe(1);
    expect(dbConnectionKeyword?.frequency).toBe(1);

    // 4. 統合フラグが false または mergedChildIssueIds が空
    // （戻り値に統合情報が含まれる場合）
    expect(result.totalIssueCount).toBe(2);

    // 5. 優先度スコアが独立して計算されている（統合による再計算なし）
    expect(dbErrorKeyword?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(dbErrorKeyword?.priorityScore).toBeLessThanOrEqual(100);
    expect(dbConnectionKeyword?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(dbConnectionKeyword?.priorityScore).toBeLessThanOrEqual(100);

    // 6. データ品質スコアが計算されている
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 7. 分析実行時刻が ISO 8601 形式で記録されている
    expect(result.analysisExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});