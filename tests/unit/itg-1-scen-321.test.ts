import { generateAndSendManagerConfirmationEmail } from "../../src/logic/confirmation-email-generation";

describe("generateAndSendManagerConfirmationEmail", () => {
  test("SCEN-321: throws ManagerEmailRecipientNotFoundError when manager email address is empty", async () => {
    const mockDetermineManagerEmailRecipients = jest.fn().mockResolvedValue({
      recipients: [
        {
          userId: "manager001",
          emailAddress: "",
          displayName: "Manager User",
          teamId: "team-dev",
        },
      ],
      recipientCount: 1,
    });

    const mockSendEmailWithRetry = jest.fn();
    const mockRecordEmailSendingHistory = jest.fn();

    const input = {
      managerUserId: "manager001",
      aggregationDate: "2026-01-15",
      unsubmittedMembers: [],
      prioritizedIssues: [
        {
          issueText: "バグ",
          frequency: 3,
          impactScore: 10,
          priority: "high" as const,
        },
      ],
      submissionDeadline: "2026-01-15T09:00:00Z",
      teamId: "team-dev",
    };

    try {
      await generateAndSendManagerConfirmationEmail(input);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/部長のメールアドレスが見つかりません/);
    }

    expect(mockSendEmailWithRetry).not.toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});