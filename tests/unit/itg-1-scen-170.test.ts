import { encryptDailyReportData } from "../../src/logic/data-security";

describe("朝会報告管理システム - 日報暗号化機能", () => {
  // SCEN-170
  test("日報データが null のとき暗号化処理がエラーになる", () => {
    const invalidInput = {
      reporterId: "ENG001",
      reportDate: new Date("2024-01-15"),
      yesterdayAccomplishment: "前日の実績",
      todayPlan: "本日の予定",
      challenges: "抱えている課題",
      encryptionKeyId: "KEY-2024-01",
      executorUserId: "ADMIN001",
    };

    // @ts-expect-error - intentionally passing null to test null handling
    const inputWithNullData = {
      ...invalidInput,
      yesterdayAccomplishment: null,
    };

    expect(() => {
      encryptDailyReportData(inputWithNullData);
    }).toThrow(/日報データ|null値|不正/);
  });
});