import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { saveReport } from "../../src/logic/report-persistence";
import type { SaveReportInput } from "../../src/logic/report-persistence";

describe("Report Persistence - saveReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-149
  test("should throw PersistenceFailureError when database save fails", async () => {
    const validateReportSubmissionMock = jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
    });

    const encryptReportDataMock = jest.fn().mockReturnValue({
      encryptedYesterdayAccomplishment: "encrypted_yesterday",
      encryptedTodayPlan: "encrypted_today",
      encryptedIssuesAndConcerns: "encrypted_issues",
      encryptionMethod: "AES-256-GCM",
    });

    const persistenceError = new Error("Database connection failed");
    persistenceError.name = "PersistenceFailureError";
    const persistReportWithEncryptionMock = jest
      .fn()
      .mockRejectedValue(persistenceError);

    const input: SaveReportInput = {
      reporterId: "user123",
      teamId: "team-A",
      reportDate: new Date("2024-01-15T00:00:00Z"),
      yesterdayAccomplishment: "昨日の実績",
      todayPlan: "本日の予定",
      issuesAndConcerns: "抱えている課題",
      attachmentUrls: [],
    };

    jest.spyOn(global, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            isValid: true,
            errors: [],
          }),
          { status: 200 }
        )
      )
    );

    const testError = new Error("日報の保存に失敗しました。通信環境を確認して再度お試しください。");
    testError.name = "PersistenceFailureError";

    await expect(saveReport(input)).rejects.toThrow(/保存に失敗/);
    await expect(saveReport(input)).rejects.toThrow(/通信環境/);
  });
});