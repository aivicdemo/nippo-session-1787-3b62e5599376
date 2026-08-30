import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出とランク付け", () => {
  test("SCEN-407: 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する", () => {
    const analysisStartDate = new Date("2024-12-15T00:00:00Z");
    const analysisEndDate = new Date("2025-01-15T00:00:00Z");
    const minimumConfidenceThreshold = 50;

    const reports = [
      {
        reportId: "report_001",
        reportDate: new Date("2025-01-15T09:00:00Z"),
        issueText: "データベース接続エラーが発生しました",
        teamId: "team_001",
      },
      {
        reportId: "report_002",
        reportDate: new Date("2025-01-14T09:00:00Z"),
        issueText: "API応答時間遅延の問題があります",
        teamId: "team_001",
      },
      {
        reportId: "report_003",
        reportDate: new Date("2025-01-13T09:00:00Z"),
        issueText: "データベース接続エラーが再発しています",
        teamId: "team_002",
      },
      {
        reportId: "report_004",
        reportDate: new Date("2025-01-12T09:00:00Z"),
        issueText: "デプロイメント失敗に対応中です",
        teamId: "team_001",
      },
      {
        reportId: "report_005",
        reportDate: new Date("2025-01-11T09:00:00Z"),
        issueText: "データベース接続エラーの原因を特定しました",
        teamId: "team_003",
      },
      {
        reportId: "report_006",
        reportDate: new Date("2025-01-10T09:00:00Z"),
        issueText: "API応答時間遅延の影響でタイムアウトが発生",
        teamId: "team_002",
      },
      {
        reportId: "report_007",
        reportDate: new Date("2025-01-09T09:00:00Z"),
        issueText: "ネットワークリソース不足",
        teamId: "team_001",
      },
      {
        reportId: "report_008",
        reportDate: new Date("2025-01-08T09:00:00Z"),
        issueText: "パフォーマンスの最適化を検討中",
        teamId: "team_003",
      },
      {
        reportId: "report_009",
        reportDate: new Date("2025-01-07T09:00:00Z"),
        issueText: "セキュリティアップデートが完了しました",
        teamId: "team_002",
      },
      {
        reportId: "report_010",
        reportDate: new Date("2025-01-06T09:00:00Z"),
        issueText: "ロードバランサーの設定を確認しました",
        teamId: "team_001",
      },
    ];

    const result = extractAndRankIssuesFromReports({
      reports: reports,
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      minimumConfidenceThreshold: minimumConfidenceThreshold,
    });

    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.totalIssueCount).toBe(3);
    expect(result.analysisTimestamp).toBeDefined();
    expect(result.lowConfidenceIssueCount).toBe(0);

    const databaseConnectionIssue = result.issues.find(
      (issue) => issue.keyword === "データベース接続エラー"
    );
    const apiDelayIssue = result.issues.find(
      (issue) => issue.keyword === "API応答時間遅延"
    );
    const deploymentFailureIssue = result.issues.find(
      (issue) => issue.keyword === "デプロイメント失敗"
    );

    expect(databaseConnectionIssue).toBeDefined();
    expect(databaseConnectionIssue?.occurrenceCount).toBe(3);
    expect(databaseConnectionIssue?.impactScore).toBe(60);
    expect(databaseConnectionIssue?.priorityScore).toBe(36);
    expect(databaseConnectionIssue?.priorityLevel).toBe("high");
    expect(databaseConnectionIssue?.affectedEmployeeCount).toBe(3);

    expect(apiDelayIssue).toBeDefined();
    expect(apiDelayIssue?.occurrenceCount).toBe(2);
    expect(apiDelayIssue?.impactScore).toBe(40);
    expect(apiDelayIssue?.priorityScore).toBe(17.2);
    expect(apiDelayIssue?.priorityLevel).toBe("medium");
    expect(apiDelayIssue?.affectedEmployeeCount).toBe(2);

    expect(deploymentFailureIssue).toBeDefined();
    expect(deploymentFailureIssue?.occurrenceCount).toBe(1);
    expect(deploymentFailureIssue?.impactScore).toBe(20);
    expect(deploymentFailureIssue?.priorityScore).toBe(8.6);
    expect(deploymentFailureIssue?.priorityLevel).toBe("low");
    expect(deploymentFailureIssue?.affectedEmployeeCount).toBe(1);

    expect(result.issues[0].priorityScore).toBeGreaterThan(
      result.issues[1].priorityScore
    );
    expect(result.issues[1].priorityScore).toBeGreaterThan(
      result.issues[2].priorityScore
    );

    expect(result.issues[0].keyword).toBe("データベース接続エラー");
    expect(result.issues[1].keyword).toBe("API応答時間遅延");
    expect(result.issues[2].keyword).toBe("デプロイメント失敗");

    expect(result.analysisTimestamp instanceof Date).toBe(true);
    expect(result.analysisTimestamp.getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );
  });
});