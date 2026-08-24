import { generateAndSendConfirmationEmail } from "../../src/logic/notification-delivery";
import { type ConfirmationEmailInput, type ConfirmationEmailOutput } from "../../src/logic/notification-delivery";

describe("朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能", () => {
  // SCEN-441
  test("報告受付期限時刻が不正な日時形式のとき処理を中止しエラーを返す", () => {
    const invalidDateTimeFormats = [
      "2024-13-45 25:70:90",
      "2024/13/45",
      "abc",
      "2024-01-01T",
      "",
      "2024-01-01",
      "01-01-2024",
      "2024-01-01 25:00:00",
      "invalid-date",
      null,
      undefined,
    ];

    for (const invalidFormat of invalidDateTimeFormats) {
      const invalidInput: ConfirmationEmailInput = {
        reportDeadlineDateTime: invalidFormat as unknown as Date,
        aggregatedReports: [
          {
            reportId: "report-001",
            reporterUserId: "user-001",
            reporterName: "Engineer A",
            yesterdayAccomplishment: "Completed feature X",
            todayPlan: "Start feature Y",
            challenges: "No blocking issues",
            submissionDateTime: new Date("2024-01-15T08:30:00Z"),
          },
        ],
        managerUserId: "manager-001",
        teamId: "team-001",
        analysisDate: new Date("2024-01-15T09:00:00Z"),
      };

      expect(() => generateAndSendConfirmationEmail(invalidInput)).toThrow(/報告受付期限時刻|日時形式/);
    }
  });
});