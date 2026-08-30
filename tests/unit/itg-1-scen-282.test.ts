import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { generateAndSendManagerConfirmationEmail } from "../../src/logic/confirmation-email-generation";

describe("confirmation-email-generation", () => {
  test("SCEN-282: should throw EmailSendingFailureError when email sending fails", async () => {
    const mockSendEmailWithRetry = jest.fn().mockImplementation(() => {
      const error = new Error(
        "メール送信に失敗しました。ネットワーク接続とメールサービスの状態を確認してください。"
      );
      (error as any).name = "EmailSendingFailureError";
      throw error;
    });

    const managerConfirmationEmailInput = {
      managerUserId: "MGR001",
      aggregationDate: "2024-01-15",
      unsubmittedMembers: [{ memberId: "M001", memberName: "太郎" }],
      prioritizedIssues: [
        {
          issueKeyword: "サーバー障害",
          frequency: 3,
          priority: "high" as const,
        },
      ],
      submissionDeadline: "2024-01-15T09:00:00Z",
      teamId: "TEAM001",
      sendEmailWithRetry: mockSendEmailWithRetry,
    };

    await expect(
      generateAndSendManagerConfirmationEmail(managerConfirmationEmailInput)
    ).rejects.toThrow(/メール送信に失敗しました/);
  });
});