import { prepareDashboardData, type DashboardDataPrepareInput } from "../../src/logic/dashboard-presentation";

describe("朝会報告管理システム - ダッシュボードプレゼンテーション", () => {
  // SCEN-360: [error] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す。 - チームメンバーリストが空またはnullのときという明示された境界条件でチームメンバー情報が取得できません
  test("チームメンバーリストが空のとき、DataAggregationFailureErrorを発生させること", () => {
    const input: DashboardDataPrepareInput = {
      teamId: "team-001",
      targetDate: new Date("2024-01-15T00:00:00Z"),
      requestingUserId: "user-director-001",
      includeHistoricalTrend: false,
    };

    expect(() => prepareDashboardData(input)).toThrow(/チームメンバー情報/);
  });
});