import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-analysis-report";

describe("Weekly Analysis Report Generation", () => {
  test("SCEN-421: [normal] 毎週月曜朝に前週（月曜～日曜）の日報データを集約し、課題を抽出・分析して、優先度スコア付きの週次課題傾向レポートを生成する", () => {
    const analysisStartDate = new Date("2024-01-08");
    const analysisEndDate = new Date("2024-01-14");
    const teamId = "team-001";

    const reportRecords = [
      {
        reportId: "report-001",
        reportDate: "2024-01-08",
        employeeId: "member001",
        yesterdayWork: "APIドキュメント作成",
        todayWork: "テスト実装",
        issues: "データベース接続タイムアウト発生",
      },
      {
        reportId: "report-002",
        reportDate: "2024-01-09",
        employeeId: "member002",
        yesterdayWork: "UI修正",
        todayWork: "レビュー対応",
        issues: "ブラウザ互換性の問題",
      },
      {
        reportId: "report-003",
        reportDate: "2024-01-10",
        employeeId: "member003",
        yesterdayWork: "デプロイ準備",
        todayWork: "本番反映",
        issues: "リリースメモ未完成",
      },
      {
        reportId: "report-004",
        reportDate: "2024-01-11",
        employeeId: "member004",
        yesterdayWork: "ビルドスクリプト修正",
        todayWork: "テスト自動化",
        issues: "ビルド失敗",
      },
      {
        reportId: "report-005",
        reportDate: "2024-01-12",
        employeeId: "member005",
        yesterdayWork: "リソース割当調整",
        todayWork: "スケジュール確認",
        issues: "リソース不足",
      },
      {
        reportId: "report-006",
        reportDate: "2024-01-13",
        employeeId: "member006",
        yesterdayWork: "ドキュメント更新",
        todayWork: "チームレビュー",
        issues: "仕様変更への対応遅延",
      },
      {
        reportId: "report-007",
        reportDate: "2024-01-14",
        employeeId: "member007",
        yesterdayWork: "環境構築",
        todayWork: "統合テスト",
        issues: "依存パッケージの競合",
      },
      {
        reportId: "report-008",
        reportDate: "2024-01-08",
        employeeId: "member008",
        yesterdayWork: "パフォーマンス測定",
        todayWork: "最適化実装",
        issues: "レスポンスタイム遅延",
      },
      {
        reportId: "report-009",
        reportDate: "2024-01-09",
        employeeId: "member009",
        yesterdayWork: "セキュリティレビュー",
        todayWork: "脆弱性対応",
        issues: "認証機能の仕様確認不足",
      },
      {
        reportId: "report-010",
        reportDate: "2024-01-10",
        employeeId: "member010",
        yesterdayWork: "ログシステム導入",
        todayWork: "ダッシュボード構築",
        issues: "ログ出力量の増加",
      },
    ];

    const aggregatedReportData = {
      reportRecords: reportRecords,
      extractedIssues: [
        {
          issueId: "issue-001",
          issueContent: "データベース接続タイムアウト発生",
          reporterTeamId: teamId,
          occurrenceCount: 1,
        },
        {
          issueId: "issue-002",
          issueContent: "ブラウザ互換性の問題",
          reporterTeamId: teamId,
          occurrenceCount: 1,
        },
        {
          issueId: "issue-003",
          issueContent: "リリースメモ未完成",
          reporterTeamId: teamId,
          occurrenceCount: 1,
        },
        {
          issueId: "issue-004",
          issueContent: "ビルド失敗",
          reporterTeamId: teamId,
          occurrenceCount: 1,
        },
        {
          issueId: "issue-005",
          issueContent: "リソース不足",
          reporterTeamId: teamId,
          occurrenceCount: 1,
        },
        {
          issueId: "issue-006",
          issueContent: "仕様変更への対応遅延",
          reporterTeamId: teamId,
          occurrenceCount: 1,
        },
        {
          issueId: "issue-007",
          issueContent: "依存パッケージの競合",
          reporterTeamId: teamId,
          occurrenceCount: 1,
        },
      ],
      dataQualityMetrics: {
        completenessRate: 1.0,
        deduplicationRate: 0.95,
        validityRate: 0.98,
      },
    };

    const input = {
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      teamId: teamId,
      aggregatedReportData: aggregatedReportData,
      minimumReportThreshold: 5,
    };

    const result = generateWeeklyAnalysisReport(input);

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe("string");

    expect(result.aggregationPeriod.startDate).toEqual(analysisStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(analysisEndDate);

    expect(Array.isArray(result.issueRanking)).toBe(true);
    expect(result.issueRanking.length).toBeGreaterThanOrEqual(7);

    result.issueRanking.forEach((rankedIssue) => {
      expect(typeof rankedIssue.issueKeyword).toBe("string");
      expect(typeof rankedIssue.frequency).toBe("number");
      expect(rankedIssue.frequency).toBeGreaterThan(0);
    });

    expect(Array.isArray(result.priorityScores)).toBe(true);
    expect(result.priorityScores.length).toBeGreaterThanOrEqual(7);

    result.priorityScores.forEach((priorityScore) => {
      expect(typeof priorityScore.keyword).toBe("string");
      expect(typeof priorityScore.priorityScore).toBe("number");
      expect(priorityScore.priorityScore).toBeGreaterThanOrEqual(0);
      expect(priorityScore.priorityScore).toBeLessThanOrEqual(100);
      expect(["high", "medium", "low"]).toContain(priorityScore.priorityLevel);
    });

    expect(Array.isArray(result.recommendedActions)).toBe(true);

    expect(Array.isArray(result.colorCodedIssueList)).toBe(true);
    expect(result.colorCodedIssueList.length).toBeGreaterThanOrEqual(7);

    result.colorCodedIssueList.forEach((colorCodedIssue) => {
      expect(typeof colorCodedIssue.issueKeyword).toBe("string");
      expect(["red", "yellow", "green"]).toContain(colorCodedIssue.color);
    });

    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());

    const highPriorityCount = result.colorCodedIssueList.filter(
      (issue) => issue.color === "red"
    ).length;
    expect(highPriorityCount).toBeGreaterThanOrEqual(0);

    const mediumPriorityCount = result.colorCodedIssueList.filter(
      (issue) => issue.color === "yellow"
    ).length;
    expect(mediumPriorityCount).toBeGreaterThanOrEqual(0);

    const lowPriorityCount = result.colorCodedIssueList.filter(
      (issue) => issue.color === "green"
    ).length;
    expect(lowPriorityCount).toBeGreaterThanOrEqual(0);

    const totalColorCodedIssues =
      highPriorityCount + mediumPriorityCount + lowPriorityCount;
    expect(totalColorCodedIssues).toEqual(result.colorCodedIssueList.length);
  });
});