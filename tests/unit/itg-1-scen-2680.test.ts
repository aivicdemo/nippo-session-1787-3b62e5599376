import { fetchYesterdayReport } from "../../src/logic/report-submission";

describe("前日報告内容取得機能", () => {
  // SCEN-2680
  test("ユーザーID が null のとき、エラーが発生する", () => {
    const targetDate = new Date("2024-01-15");
    const requestingUserId = "user-001";

    expect(() =>
      fetchYesterdayReport({
        engineerId: null as any,
        targetDate,
        requestingUserId,
      })
    ).toThrow(/ユーザーID/);
  });
});