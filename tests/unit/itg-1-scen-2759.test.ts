import { extractDashboardReportData } from "../../src/logic/manager-dashboard";
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
} from "../../src/logic/manager-dashboard";

describe("部長向けダッシュボード報告提出状況表示", () => {
  // SCEN-2759: [error] ダッシュボード優先度表示機能 - 報告者情報（ユーザーID）が欠落しているとき表示処理が失敗する
  test("should throw error when reporterUserId is missing or empty in dashboard report data extraction", () => {
    const input: ExtractDashboardReportDataInput = {
      userId: "manager-001",
      teamId: "team-engineering",
      reportDate: "2024-01-15",
      includeUnsubmitted: true,
    };

    expect(() => extractDashboardReportData(input)).toThrow(/ユーザーID/);
  });
});