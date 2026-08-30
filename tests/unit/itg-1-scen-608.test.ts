import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { saveReport } from "../../src/logic/report-persistence";

describe("朝会報告管理システム - 日報永続化", () => {
  test("SCEN-608: 報告日が未来の日付のときエラーをスロー", () => {
    const now = new Date("2024-01-15T09:00:00Z");
    const futureDate = new Date("2024-01-16T09:00:00Z");

    const invalidInput = {
      reporterId: "eng-001",
      teamId: "team-A",
      reportDate: futureDate,
      yesterdayAccomplishment: "昨日は機能Aを実装した",
      todayPlan: "今日は機能Bのテストを実施する",
      issuesAndConcerns: "機能Cの仕様が不明確",
      attachmentUrls: [],
    };

    expect(() => saveReport(invalidInput)).toThrow(/日付/);
  });
});