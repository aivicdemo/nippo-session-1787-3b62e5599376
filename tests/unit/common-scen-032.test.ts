import { getDeadlineInfo } from "../../src/logic/report-deadline-management";

describe("報告期限管理 - 期限情報取得", () => {
  // SCEN-032
  test("呼び出し元に期限情報の参照権限がない場合、期限情報の参照権限がありませんエラーをスロー", () => {
    const deadlineInfoRequest = {
      teamId: "team-001",
      reportType: "朝会報告",
      requestedAt: new Date("2024-01-15T10:00:00Z"),
    };
    const callerUserId = "unauthorized-user-id";

    expect(() =>
      getDeadlineInfo(deadlineInfoRequest, callerUserId)
    ).toThrow(/期限情報の参照権限/);
  });
});