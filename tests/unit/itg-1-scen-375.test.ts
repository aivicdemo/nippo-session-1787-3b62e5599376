import { aggregateReportsByPeriod } from "../../src/logic/report-data-aggregation";

describe("朝会報告管理システム - 日報データ集約処理", () => {
  test("SCEN-375: 指定期間内に日報データが存在しない場合、NoReportDataFoundErrorをthrowする", () => {
    // 入力値を準備
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-07T23:59:59Z");
    const periodType = "daily";
    const targetTeamIds: string[] = [];
    const includeArchivedReports = false;

    // aggregateReportsByPeriod 関数に準備した入力値を渡して呼び出す
    // 戻り値の型・内容を検証する - NoReportDataFoundError エラーが throw されることを確認
    expect(() => {
      aggregateReportsByPeriod(
        startDate,
        endDate,
        periodType,
        targetTeamIds,
        includeArchivedReports
      );
    }).toThrow(/報告データ/);
  });
});