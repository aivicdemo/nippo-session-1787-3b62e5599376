import { generateAndSendManagerConfirmationEmail } from "../../src/logic/confirmation-email-generation";

describe("generateAndSendManagerConfirmationEmail", () => {
  test("SCEN-085: throws ManagerEmailRecipientNotFoundError when manager email address is not found", async () => {
    const managerUserId = "nonexistent-manager-id";
    const teamId = "team-001";
    const aggregationDate = "2026-08-19T00:00:00Z";
    const reportDeadline = "2026-08-19T09:30:00Z";

    const unsubmittedMembers = [
      {
        employeeId: "emp-001",
        employeeName: "田中太郎",
        minutesUntilDeadline: 45,
      },
    ];

    const prioritizedIssues = [
      {
        issueId: "issue-001",
        content: "ビルド失敗",
        priorityRank: "high" as const,
        colorCode: "#FF0000",
        frequency: 3,
        impactScore: 80,
      },
    ];

    const submissionDeadline = new Date("2026-08-19T09:30:00Z");

    await expect(
      generateAndSendManagerConfirmationEmail(
        managerUserId,
        teamId,
        aggregationDate,
        unsubmittedMembers,
        prioritizedIssues,
        submissionDeadline
      )
    ).rejects.toThrow(/部長のメールアドレス/);
  });
});