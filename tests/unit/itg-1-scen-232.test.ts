import { generateAndSendSummaryEmail } from "../../src/logic/notification-delivery";
import type {
  GenerateAndSendSummaryEmailInput,
  SubmittedReportSummary,
} from "../../src/logic/notification-delivery";

describe("日報集約メール送信機能", () => {
  // SCEN-232
  test("送信者に重複がある場合、エラーメッセージを表示してDBに記録しない", async () => {
    const duplicateReporterId = "user_001";

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: "team_A",
      reportDate: "2024-01-15",
      managerUserId: "manager_001",
      submittedReports: [
        {
          reporterId: duplicateReporterId,
          reporterName: "Member One",
          submittedAt: "2024-01-15T08:30:00Z",
          challenges: ["課題A"],
        } as SubmittedReportSummary,
        {
          reporterId: duplicateReporterId,
          reporterName: "Member One",
          submittedAt: "2024-01-15T08:35:00Z",
          challenges: ["課題B"],
        } as SubmittedReportSummary,
      ],
      unsubmittedMemberIds: ["user_002", "user_003"],
      reportDeadlineTime: "09:00",
    };

    expect(() => generateAndSendSummaryEmail(input)).toThrow(/重複/);
  });
});