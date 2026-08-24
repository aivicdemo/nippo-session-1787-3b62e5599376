import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";
import type { MonthlyReportDataset } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - 日報データ集約・アーカイブ機能", () => {
  // SCEN-2395: [normal] 日報データ集約・アーカイブ機能 - 集約期間内に複数件の日報データがある場合、すべてが現用領域に保持される
  test("集約期間内の複数件日報データがすべて現用領域に保持される", () => {
    const targetYear = 2026;
    const targetMonth = 1;
    const requestedByUserId = "user-dept-head-001";
    const aggregationStartDate = new Date("2026-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2026-01-31T23:59:59Z");

    const mockReportRecords = [
      {
        reportId: "report-001",
        teamId: "team-dev-001",
        userId: "user-engineer-001",
        reportDate: new Date("2026-01-05T09:30:00Z"),
        yesterdayAccomplishment:
          "データベース設計ドキュメント作成完了。テーブル定義を8割完成させた。",
        todayPlan:
          "ユーザーテーブルの詳細仕様レビュー。チーム会議で設計確認予定。",
        issuesDescription:
          "SQL関数のテストで想定外の動作が発生。パフォーマンス測定が未実施。",
        createdAt: new Date("2026-01-05T09:30:00Z"),
        storageLocation: "active",
      },
      {
        reportId: "report-002",
        teamId: "team-dev-001",
        userId: "user-engineer-002",
        reportDate: new Date("2026-01-10T09:30:00Z"),
        yesterdayAccomplishment:
          "APIエンドポイント5個を実装・単体テスト完了。ドキュメント作成中。",
        todayPlan:
          "統合テスト環境でのAPIテスト実行。バグ修正と最適化。",
        issuesDescription:
          "ログ出力形式の統一がまだ完了していない。チーム内で仕様確認が必要。",
        createdAt: new Date("2026-01-10T09:30:00Z"),
        storageLocation: "active",
      },
      {
        reportId: "report-003",
        teamId: "team-dev-002",
        userId: "user-engineer-003",
        reportDate: new Date("2026-01-15T09:30:00Z"),
        yesterdayAccomplishment:
          "フロントエンドコンポーネント12個のスタイリング完了。レイアウト調整も終了。",
        todayPlan:
          "コンポーネント統合テストの実施。ブラウザ互換性チェック。",
        issuesDescription:
          "IE11との互換性問題。特定のCSS機能が未対応。回避策の検討が必要。",
        createdAt: new Date("2026-01-15T09:30:00Z"),
        storageLocation: "active",
      },
      {
        reportId: "report-004",
        teamId: "team-qa-001",
        userId: "user-engineer-004",
        reportDate: new Date("2026-01-20T09:30:00Z"),
        yesterdayAccomplishment:
          "テストケース50件の作成と実行。不具合3件を検出し報告完了。",
        todayPlan:
          "検出した不具合の再現確認と詳細ログ取得。開発チームへの情報共有。",
        issuesDescription:
          "テスト環境でのデータベース接続が不安定。環境構築の見直しが必要。",
        createdAt: new Date("2026-01-20T09:30:00Z"),
        storageLocation: "active",
      },
      {
        reportId: "report-005",
        teamId: "team-dev-001",
        userId: "user-engineer-005",
        reportDate: new Date("2026-01-25T09:30:00Z"),
        yesterdayAccomplishment:
          "セキュリティ脆弱性スキャン実施。7件の中リスク問題と2件の低リスク問題を検出。",
        todayPlan:
          "検出された中リスク問題への対応。ホワイトリスト設定の調整。",
        issuesDescription:
          "外部認証ライブラリのバージョン更新が必要だが、互換性テストに時間がかかる。",
        createdAt: new Date("2026-01-25T09:30:00Z"),
        storageLocation: "active",
      },
    ];

    const stubNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        deliveryId: "notif-001",
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: "sched-001",
        scheduledTime: new Date("2026-01-01T08:30:00Z"),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        deliveryId: "notif-001",
        status: "delivered",
      }),
    };

    const stubTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "データベース設計", frequency: 1, confidence: 0.95 },
          { keyword: "API実装", frequency: 1, confidence: 0.92 },
          { keyword: "フロントエンド", frequency: 1, confidence: 0.88 },
          { keyword: "テスト環境", frequency: 1, confidence: 0.85 },
          { keyword: "セキュリティ脆弱性", frequency: 1, confidence: 0.96 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 72,
        severity: "medium",
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "medium",
        confidence: 0.89,
      }),
    };

    const result: MonthlyReportDataset = extractMonthlyReportData(
      {
        targetYear: targetYear,
        targetMonth: targetMonth,
        requestedByUserId: requestedByUserId,
        teamIdFilter: undefined,
      },
      stubNotificationService,
      stubTextAnalysisService,
      mockReportRecords,
      aggregationStartDate,
      aggregationEndDate
    );

    expect(result.totalReportCount).toBe(5);

    expect(result.extractionPeriodStart).toBe("2026-01-01T00:00:00Z");
    expect(result.extractionPeriodEnd).toBe("2026-01-31T23:59:59Z");

    const allReportIds = result.reportsByTeam
      .flatMap((teamSummary) => teamSummary.reportIds)
      .sort();
    const expectedReportIds = [
      "report-001",
      "report-002",
      "report-003",
      "report-004",
      "report-005",
    ].sort();
    expect(allReportIds).toEqual(expectedReportIds);

    for (const teamSummary of result.reportsByTeam) {
      expect(teamSummary.reportCount).toBeGreaterThan(0);
      expect(teamSummary.reportIds.length).toBe(teamSummary.reportCount);
      expect(teamSummary.submissionRate).toBeGreaterThanOrEqual(0);
      expect(teamSummary.submissionRate).toBeLessThanOrEqual(100);
    }

    const team_dev_001_summary = result.reportsByTeam.find(
      (ts) => ts.teamId === "team-dev-001"
    );
    expect(team_dev_001_summary).toBeDefined();
    expect(team_dev_001_summary!.reportCount).toBe(3);
    expect(team_dev_001_summary!.reportIds).toContain("report-001");
    expect(team_dev_001_summary!.reportIds).toContain("report-002");
    expect(team_dev_001_summary!.reportIds).toContain("report-005");

    const team_dev_002_summary = result.reportsByTeam.find(
      (ts) => ts.teamId === "team-dev-002"
    );
    expect(team_dev_002_summary).toBeDefined();
    expect(team_dev_002_summary!.reportCount).toBe(1);
    expect(team_dev_002_summary!.reportIds).toContain("report-003");

    const team_qa_001_summary = result.reportsByTeam.find(
      (ts) => ts.teamId === "team-qa-001"
    );
    expect(team_qa_001_summary).toBeDefined();
    expect(team_qa_001_summary!.reportCount).toBe(1);
    expect(team_qa_001_summary!.reportIds).toContain("report-004");

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);

    for (const mockReport of mockReportRecords) {
      expect(mockReport.storageLocation).toBe("active");
    }

    expect(result.reportsByTeam.length).toBeGreaterThan(0);
    const totalExtractedReports = result.reportsByTeam.reduce(
      (sum, team) => sum + team.reportCount,
      0
    );
    expect(totalExtractedReports).toBe(5);
  });
});