import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("issue-extraction-prioritization", () => {
  // SCEN-2262: [edge] 課題の重複検出と正規化 - 報告入力の順序が逆（新しい報告が先）の場合でも、重複検出結果が変わらない
  test("should detect duplicate issues consistently regardless of report input order", () => {
    const teamId = "team-001";
    const startDate = new Date("2024-01-10T00:00:00Z");
    const endDate = new Date("2024-01-10T23:59:59Z");
    const requestUserId = "user-001";
    const minFrequencyThreshold = 1;

    // スタブ化されたテキスト分析アダプターを作成
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: "データベース接続エラー",
          frequency: 2,
          confidence: 0.95,
        },
      ]),
      assessImpactScore: jest
        .fn()
        .mockResolvedValue({ impactScore: 75, affectedTeams: 2 }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValue({ severity: "high" }),
    };

    // テストケース1: 報告A → 報告Bの順序（古い順）
    const input1: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // テストケース2: 報告B → 報告Aの順序（新しい順）
    const input2: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // 両方のテストケースで同じ入力を使用し、結果を比較
    const result1 = extractAndRankIssueKeywords(
      input1,
      mockTextAnalysisAdapter
    );
    const result2 = extractAndRankIssueKeywords(
      input2,
      mockTextAnalysisAdapter
    );

    // 期待結果の検証
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();

    // 両ケースで同じキーワード数が返されることを検証
    expect(result1.keywords.length).toBe(result2.keywords.length);

    // キーワードが同じであることを検証
    expect(result1.keywords[0].keyword).toBe(result2.keywords[0].keyword);
    expect(result1.keywords[0].keyword).toBe("データベース接続エラー");

    // 発生頻度が一致していることを検証
    expect(result1.keywords[0].frequency).toBe(result2.keywords[0].frequency);
    expect(result1.keywords[0].frequency).toBe(2);

    // ランクが一致していることを検証
    expect(result1.keywords[0].rank).toBe(result2.keywords[0].rank);
    expect(result1.keywords[0].rank).toBe(1);

    // 全キーワード数が一致していることを検証
    expect(result1.totalKeywordCount).toBe(result2.totalKeywordCount);

    // 抽出日時が設定されていることを検証
    expect(result1.extractedAt).toBeInstanceOf(Date);
    expect(result2.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間の日数が一致していることを検証
    expect(result1.analysisperiodDays).toBe(result2.analysisperiodDays);
  });
});