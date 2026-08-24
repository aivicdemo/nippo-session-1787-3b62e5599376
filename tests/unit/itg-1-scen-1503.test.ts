import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("extractAndRankIssueKeywords", () => {
  test("SCEN-1503: 7日間の日報データに同一キーワードの重複が含まれる場合、重複を正確に計数してランク付けされる", () => {
    // Test data setup: 7 days of daily reports with duplicate keywords
    const mockReportDay1 = "昨日はデータベース接続エラーが発生し、メモリリークの調査を実施しました。";
    const mockReportDay2 = "API応答遅延による処理遅延が複数件報告されました。";
    const mockReportDay3 = "データベース接続エラーが再発しました。ユーザーから苦情が届いています。";
    const mockReportDay4 = "API応答遅延の問題が本番環境でも確認されました。";
    const mockReportDay5 = "データベース接続エラーの根本原因を特定し、修正をデプロイしました。";
    const mockReportDay6 = "API応答遅延の最適化を開始しました。ネットワークレイテンシが疑わしい。";
    const mockReportDay7 = "メモリリークの問題がテスト環境で再現しました。";

    const reportTexts = [
      mockReportDay1,
      mockReportDay2,
      mockReportDay3,
      mockReportDay4,
      mockReportDay5,
      mockReportDay6,
      mockReportDay7,
    ];

    // Stub TextAnalysisServiceAdapter.extractKeywords
    // Each day's report returns extracted keywords with frequency tracking
    const mockExtractedKeywordsByDay = [
      // Day1: database error (1), memory leak (1)
      {
        "データベース接続エラー": 1,
        "メモリリーク": 1,
      },
      // Day2: API latency (1)
      {
        "API応答遅延": 1,
      },
      // Day3: database error (1)
      {
        "データベース接続エラー": 1,
      },
      // Day4: API latency (1)
      {
        "API応答遅延": 1,
      },
      // Day5: database error (1)
      {
        "データベース接続エラー": 1,
      },
      // Day6: API latency (1)
      {
        "API応答遅延": 1,
      },
      // Day7: memory leak (1)
      {
        "メモリリーク": 1,
      },
    ];

    // Create stub for TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn((text: string): Record<string, number> => {
        const dayIndex = reportTexts.indexOf(text);
        return dayIndex >= 0 ? mockExtractedKeywordsByDay[dayIndex] : {};
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"), // Day 1
      endDate: new Date("2024-01-14T23:59:59Z"), // Day 7
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    // Simulate document data for 7 days
    const mockDailyReports = reportTexts.map((text, index) => ({
      reportId: `report-day-${index + 1}`,
      teamId: "team-001",
      reportText: text,
      submittedAt: new Date(
        new Date("2024-01-08T00:00:00Z").getTime() + index * 24 * 60 * 60 * 1000
      ),
    }));

    // Call the function with mocked adapter
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    // Verify the result structure
    expect(result).toHaveProperty("keywords");
    expect(result).toHaveProperty("totalKeywordCount");
    expect(result).toHaveProperty("extractedAt");
    expect(result).toHaveProperty("analysisperiodDays");

    // Verify analysis period calculation
    expect(result.analysisperiodDays).toBe(7);

    // Verify extracted timestamp is recorded
    expect(result.extractedAt instanceof Date).toBe(true);

    // Verify total keyword count (3 unique keywords)
    expect(result.totalKeywordCount).toBe(3);

    // Verify keywords array is ranked by frequency (descending)
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(3);

    // Expected keyword ranking:
    // 1. データベース接続エラー: frequency 3, rank 1
    // 2. API応答遅延: frequency 3, rank 2 (same frequency, secondary sort applies)
    // 3. メモリリーク: frequency 2, rank 3

    // First ranked keyword: database connection error
    expect(result.keywords[0].keyword).toBe("データベース接続エラー");
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].rank).toBe(1);
    expect(typeof result.keywords[0].keywordId).toBe("string");

    // Second ranked keyword: API latency
    expect(result.keywords[1].keyword).toBe("API応答遅延");
    expect(result.keywords[1].frequency).toBe(3);
    expect(result.keywords[1].rank).toBe(2);

    // Third ranked keyword: memory leak
    expect(result.keywords[2].keyword).toBe("メモリリーク");
    expect(result.keywords[2].frequency).toBe(2);
    expect(result.keywords[2].rank).toBe(3);

    // Verify that duplicate counting is accurate
    // Total occurrences should match sum of individual frequencies
    const totalFrequency = result.keywords.reduce(
      (sum, kw) => sum + kw.frequency,
      0
    );
    expect(totalFrequency).toBe(8); // 3 + 3 + 2 = 8

    // Verify that keywords are sorted in descending order by frequency
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
    }

    // Verify rank assignment is sequential and consistent with ordering
    result.keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
    });
  });
});