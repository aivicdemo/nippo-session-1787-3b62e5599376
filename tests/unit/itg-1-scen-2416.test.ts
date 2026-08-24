import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - 月次レポートデータ集約", () => {
  test("SCEN-2416: 集約期間が前月から当月にまたがるとき、両月のデータが同一の集約対象に含まれる", () => {
    // Arrange: テストデータの準備
    const january2026Reports = [
      {
        reportId: "RPT-2026-01-001",
        teamId: "TEAM-A",
        memberId: "MEM-001",
        reportDate: new Date("2026-01-05T09:00:00Z"),
        yesterday: "昨日やったこと: データベース設計レビュー完了",
        today: "今日やること: テーブル作成開始",
        issues: "抱えている課題: スキーマ設計の承認遅延",
      },
      {
        reportId: "RPT-2026-01-002",
        teamId: "TEAM-A",
        memberId: "MEM-002",
        reportDate: new Date("2026-01-10T09:00:00Z"),
        yesterday: "昨日やったこと: テスト計画書作成",
        today: "今日やること: テスト環境構築",
        issues: "抱えている課題: テスト環境リソース不足",
      },
      {
        reportId: "RPT-2026-01-003",
        teamId: "TEAM-A",
        memberId: "MEM-003",
        reportDate: new Date("2026-01-15T09:00:00Z"),
        yesterday: "昨日やったこと: API仕様書確認",
        today: "今日やること: API実装開始",
        issues: "抱えている課題: 仕様書の曖昧性",
      },
    ];

    const february2026Reports = [
      {
        reportId: "RPT-2026-02-001",
        teamId: "TEAM-A",
        memberId: "MEM-001",
        reportDate: new Date("2026-02-01T09:00:00Z"),
        yesterday: "昨日やったこと: テーブル実装完了",
        today: "今日やること: インデックス作成",
        issues: "抱えている課題: クエリパフォーマンス最適化",
      },
      {
        reportId: "RPT-2026-02-002",
        teamId: "TEAM-A",
        memberId: "MEM-002",
        reportDate: new Date("2026-02-10T09:00:00Z"),
        yesterday: "昨日やったこと: ユニットテスト実装",
        today: "今日やること: 統合テスト開始",
        issues: "抱えている課題: テストカバレッジ不足",
      },
    ];

    const allReports = [...january2026Reports, ...february2026Reports];

    // Act: 集約期間を前月から当月にまたがるように設定
    const aggregationStartDate = new Date("2026-01-15T00:00:00Z");
    const aggregationEndDate = new Date("2026-02-15T23:59:59Z");
    const teamIdFilter = ["TEAM-A"];

    const result = extractMonthlyReportData({
      reports: allReports,
      aggregationStartDate,
      aggregationEndDate,
      teamIdFilter,
    });

    // Assert: 集約結果の検証
    // 1. 集約期間開始日と終了日が正しいこと
    expect(result.extractionPeriodStart).toBe("2026-01-15T00:00:00Z");
    expect(result.extractionPeriodEnd).toBe("2026-02-15T23:59:59Z");

    // 2. 集約対象に含まれるレコード数が前月3件 + 当月2件 = 5件であること
    expect(result.totalReportCount).toBe(5);

    // 3. チームA（TEAM-A）が集約対象に含まれていること
    expect(result.reportsByTeam).toHaveLength(1);
    const teamASummary = result.reportsByTeam[0];

    // 4. チームAの日報件数が5件であること
    expect(teamASummary.teamId).toBe("TEAM-A");
    expect(teamASummary.reportCount).toBe(5);

    // 5. 集約対象に含まれるレポートIDが、前月と当月のすべてのレポートを含むこと
    expect(teamASummary.reportIds).toContain("RPT-2026-01-001");
    expect(teamASummary.reportIds).toContain("RPT-2026-01-002");
    expect(teamASummary.reportIds).toContain("RPT-2026-01-003");
    expect(teamASummary.reportIds).toContain("RPT-2026-02-001");
    expect(teamASummary.reportIds).toContain("RPT-2026-02-002");

    // 6. すべての報告IDが同一の集約レコード内に含まれていること
    // （前月と当月のデータが分割されていないこと）
    expect(teamASummary.reportIds.length).toBe(5);

    // 7. データ品質スコアが有効な値（0-100）であること
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 8. 抽出実行日時が記録されていること
    expect(result.extractedAt).toBeDefined();
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate).toBeInstanceOf(Date);
    expect(isNaN(extractedAtDate.getTime())).toBe(false);

    // 9. 提出率が計算されていること（0-100%）
    expect(teamASummary.submissionRate).toBeGreaterThanOrEqual(0);
    expect(teamASummary.submissionRate).toBeLessThanOrEqual(100);
  });
});