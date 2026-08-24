import { extractWeeklyReportData } from "../../src/logic/weekly-issue-analysis";
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from "../../src/logic/weekly-issue-analysis";

describe("weekly issue analysis - extractWeeklyReportData", () => {
  // SCEN-1469: [edge] 前週日報データ集約・課題抽出機能 - 複数メンバーが同一の課題キーワードを報告した場合、重複データとして同一キーワードは1件として集約される
  test("should consolidate duplicate issue keywords from multiple team members into a single entry with combined occurrence count", async () => {
    // Arrange: 前週の日報データセットを準備
    const weekStartDate = new Date("2024-01-08T00:00:00Z");
    const weekEndDate = new Date("2024-01-14T23:59:59Z");
    const teamId = "team-001";

    // 3名のメンバーが同一の課題キーワード「データベース接続エラー」を含む日報データ
    const memberAReportDate = new Date("2024-01-10T09:30:00Z");
    const memberBReportDate = new Date("2024-01-11T09:45:00Z");
    const memberCReportDate = new Date("2024-01-12T10:00:00Z");

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce({
          keywords: [
            { keyword: "データベース接続エラー", frequency: 1 },
            { keyword: "タイムアウト", frequency: 1 }
          ]
        })
        .mockResolvedValueOnce({
          keywords: [
            { keyword: "データベース接続エラー", frequency: 1 },
            { keyword: "メモリリーク", frequency: 1 }
          ]
        })
        .mockResolvedValueOnce({
          keywords: [
            { keyword: "データベース接続エラー", frequency: 1 },
            { keyword: "ネットワーク遅延", frequency: 1 }
          ]
        }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: "high" })
    };

    // 前週の日報データ（複数メンバーから同一キーワード報告）
    const dailyReportSummaries = [
      {
        reportDate: memberAReportDate,
        reportCount: 1,
        submittedByUserIds: ["member-a"],
        challengeItems: [
          "データベース接続エラーが発生し、システムが一時的に停止した",
          "タイムアウトの問題も併せて発生"
        ]
      },
      {
        reportDate: memberBReportDate,
        reportCount: 1,
        submittedByUserIds: ["member-b"],
        challengeItems: [
          "データベース接続エラーで処理が中断した",
          "メモリリークの兆候が見られた"
        ]
      },
      {
        reportDate: memberCReportDate,
        reportCount: 1,
        submittedByUserIds: ["member-c"],
        challengeItems: [
          "データベース接続エラーが再度発生",
          "ネットワーク遅延も影響している可能性"
        ]
      }
    ];

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: [teamId],
      requestedByUserId: "manager-001"
    };

    // Act: extractWeeklyReportData関数を実行
    const result: WeeklyReportDataset = await extractWeeklyReportData(
      dailyReportSummaries,
      extractionRequest,
      mockTextAnalysisAdapter
    );

    // Assert: 重複排除後の集約結果を検証
    // 期待値: 「データベース接続エラー」が1件として集約され、出現頻度が3回として記録される
    expect(result).toBeDefined();
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.totalReportsExtracted).toBe(3);
    expect(result.reportsByDate).toHaveLength(3);

    // 抽出された課題リストを検証
    expect(result.extractedChallenges).toBeDefined();

    // 「データベース接続エラー」がユニークな1件として集約されていることを確認
    const dbErrorChallenge = result.extractedChallenges.find(
      (challenge) => challenge.keyword === "データベース接続エラー"
    );

    expect(dbErrorChallenge).toBeDefined();
    expect(dbErrorChallenge?.keyword).toBe("データベース接続エラー");
    expect(dbErrorChallenge?.occurrenceCount).toBe(3); // 3人のメンバーから報告されたため、出現頻度は3
    expect(dbErrorChallenge?.rank).toBe(1); // 最も出現頻度が高いため、ランク1

    // 他の課題キーワードが正しく集約されていることを確認
    const uniqueKeywords = result.extractedChallenges.map((c) => c.keyword);
    expect(uniqueKeywords).toContain("タイムアウト");
    expect(uniqueKeywords).toContain("メモリリーク");
    expect(uniqueKeywords).toContain("ネットワーク遅延");

    // 重複排除の効果を確認：全レポートの課題項目数 > 集約後のユニークキーワード数
    const totalChallengeItemsBeforeAggregation = dailyReportSummaries.reduce(
      (sum, report) => sum + report.challengeItems.length,
      0
    );
    expect(totalChallengeItemsBeforeAggregation).toBeGreaterThan(
      result.extractedChallenges.length
    );

    // データ品質スコアが設定されていることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // モックが正しく呼ばれたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});