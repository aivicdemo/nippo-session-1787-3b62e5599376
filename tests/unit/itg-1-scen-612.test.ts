import { validateReportInput } from "../../src/logic/report-submission-management";

describe("Report Submission Management - validateReportInput", () => {
  // SCEN-612: [error] 朝会開始時刻の形式が HH:mm でないときエラーを投げる
  test("should throw error when morningMeetingStartTime is not in HH:mm format", () => {
    const reportSubmissionTime = new Date("2024-01-15T00:00:00Z");
    const modificationAttemptTime = new Date("2024-01-15T08:00:00Z");
    const modificationDeadlineMinutes = 30;

    const invalidFormats = [
      "9:30",      // 1桁時間表記
      "09-30",     // コロンではなくハイフン
      "0930",      // コロンなし
      "09:30:00",  // 秒まで含む
      "25:00",     // 形式は正しいが時間値が不正
      "",          // 空文字列
    ];

    invalidFormats.forEach((invalidFormat) => {
      expect(() =>
        validateReportInput(
          reportSubmissionTime,
          invalidFormat,
          modificationAttemptTime,
          modificationDeadlineMinutes
        )
      ).toThrow(/朝会開始時刻/);
    });
  });
});