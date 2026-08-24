import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";
import type {
  WeeklyAnalysisReportInput,
  WeeklyAnalysisReport,
  RankedIssue,
  IssuePriorityData,
} from "../../src/logic/weekly-issue-analysis";

describe("週次課題傾向レポート生成機能", () => {
  // SCEN-1560
  test("TextAnalysisServiceAdapterが正常に課題キーワードを返したとき、抽出結果がレポートに反映される", () => {
    // Arrange: モック化されたTextAnalysisServiceAdapterを準備
    const mockExtractedIssues = [
      {
        keyword: "システム連携遅延",
        occurrenceCount: 5,
        impactScore: 85,
      },
      {
        keyword: "データベースロック",
        occurrenceCount: 3,
        impactScore: 72,
      },
      {
        keyword: "ネットワーク障害",
        occurrenceCount: 2,
        impactScore: 60,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: "2024-01-08",
      aggregationEndDate: "2024-01-14",
      extractedIssues: mockExtractedIssues,
      teamId: "team-001",
    };

    // Act: 週次課題傾向レポート生成処理を実行
    const report: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);

    // Assert: レポートの基本的な構造を検証
    expect(report.reportId).toBeTruthy();
    expect(typeof report.reportId).toBe("string");

    // 集計期間が正しく設定されている
    expect(report.aggregationPeriod.startDate).toBe("2024-01-08");
    expect(report.aggregationPeriod.endDate).toBe("2024-01-14");

    // 課題ランキングが出現頻度でソートされていることを確認
    expect(report.issueRanking).toHaveLength(3);
    expect(report.issueRanking[0].issueKeyword).toBe("システム連携遅延");
    expect(report.issueRanking[0].occurrenceCount).toBe(5);
    expect(report.issueRanking[0].rank).toBe(1);

    expect(report.issueRanking[1].issueKeyword).toBe("データベースロック");
    expect(report.issueRanking[1].occurrenceCount).toBe(3);
    expect(report.issueRanking[1].rank).toBe(2);

    expect(report.issueRanking[2].issueKeyword).toBe("ネットワーク障害");
    expect(report.issueRanking[2].occurrenceCount).toBe(2);
    expect(report.issueRanking[2].rank).toBe(3);

    // 優先度スコアが計算されていることを確認
    expect(report.priorityScores).toHaveLength(3);

    // 優先度スコアが0～100の範囲内であることを確認
    report.priorityScores.forEach((priorityData: IssuePriorityData) => {
      expect(priorityData.priorityScore).toBeGreaterThanOrEqual(0);
      expect(priorityData.priorityScore).toBeLessThanOrEqual(100);
      expect(["high", "medium", "low"]).toContain(priorityData.priorityRank);
    });

    // 最初の課題（最も出現頻度が高い）は優先度が高いと判定される
    const highestFrequencyIssuePriority = report.priorityScores.find(
      (p: IssuePriorityData) => p.issueKeyword === "システム連携遅延"
    );
    expect(highestFrequencyIssuePriority).toBeTruthy();
    expect(highestFrequencyIssuePriority?.priorityRank).toBe("high");

    // 推奨対策案が生成されていることを確認
    expect(report.recommendedCountermeasures).toBeTruthy();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

    // 推奨対策が優先度の高い課題に対して生成されている
    const highPriorityCountermeasures = report.recommendedCountermeasures.filter(
      (c: any) => c.targetIssuePriority === "high"
    );
    expect(highPriorityCountermeasures.length).toBeGreaterThan(0);

    // レポート生成日時が記録されている
    expect(report.generatedAt).toBeTruthy();
    const generatedDate = new Date(report.generatedAt);
    expect(generatedDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // レポート内の課題キーワードがモックデータと一致している
    const reportIssueKeywords = report.issueRanking.map(
      (issue: RankedIssue) => issue.issueKeyword
    );
    expect(reportIssueKeywords).toEqual([
      "システム連携遅延",
      "データベースロック",
      "ネットワーク障害",
    ]);

    // 各課題のissueIdが一意であることを確認
    const issueIds = report.priorityScores.map(
      (p: IssuePriorityData) => p.issueId
    );
    const uniqueIssueIds = new Set(issueIds);
    expect(uniqueIssueIds.size).toBe(issueIds.length);
  });
});