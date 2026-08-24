import { describe, test, expect } from "@jest/globals";
import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム", () => {
  // SCEN-2200
  test("日報入力検証機能 - 抱えている課題のみが入力されていて他の2項目が空文字列の場合、昨日やったことと今日やることの2項目にエラーメッセージが表示される", () => {
    const input = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "",
      todayPlan: "",
      challenges: "データベース接続エラーの対応",
      reportDate: "2024-01-15",
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: "yesterdayAccomplishment",
        errorCode: "MissingRequiredField",
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: "todayPlan",
        errorCode: "MissingRequiredField",
      })
    );
    expect(
      result.errors.some((e) => e.fieldName === "challenges")
    ).toBe(false);
  });
});