import { getDeadlineInfo } from "../../src/logic/report-deadline-management";

describe("Report Deadline Management", () => {
  // SCEN-030
  test("should throw error when deadline setting is not found or invalid", () => {
    expect(() => getDeadlineInfo(null as any)).toThrow(/報告期限の設定が見つかりません/);
  });
});