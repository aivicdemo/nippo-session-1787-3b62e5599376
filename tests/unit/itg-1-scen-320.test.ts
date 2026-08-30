import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { generateAndSendManagerConfirmationEmail } from "../../src/logic/confirmation-email-generation";

describe("generateAndSendManagerConfirmationEmail", () => {
  test("SCEN-320: 報告データなしの場合、警告文言を含むメールを生成・送信して成功を返す", async () => {
    // Arrange
    const managerUserId = "MGR001";
    const aggregationDate = "2026-01-15";
    const unsubmittedMembers: Array<{ userId: string; userName: string }> = [];
    const prioritizedIssues: Array<{
      issueId: string;
      content: string;
      priorityRank: "high" | "medium" | "low";
      colorCode: string;
      frequency: number;
      impactScore: number;
    }> = [];
    const submissionDeadline = "2026-01-15T09:00:00Z";
    const teamId = "TEAM001";

    const mockManagerEmailRecipients = {
      recipients: [
        {
          userId: managerUserId,
          emailAddress: "manager@example.com",
          displayName: "Manager User",
          teamId: teamId,
        },
      ],
      recipientCount: 1,
    };

    const mockEmailContent = {
      subject: "朝会報告集約メール",
      body: "<html><body>本日の報告がまだ提出されていません。朝会前に確認してください</body></html>",
      generatedAt: new Date("2026-01-15T08:30:00Z"),
    };

    const mockEmailSendResult = {
      success: true,
      messageId: "MSG-20260115-001",
      attemptCount: 1,
      lastError: undefined,
    };

    // Mock dependencies
    const mockDetermineManagerEmailRecipients = jest
      .fn()
      .mockResolvedValue(mockManagerEmailRecipients);

    const mockBuildManagerConfirmationEmailContent = jest
      .fn()
      .mockResolvedValue(mockEmailContent);

    const mockSendEmailWithRetry = jest
      .fn()
      .mockResolvedValue(mockEmailSendResult);

    const mockRecordEmailSendingHistory = jest.fn().mockResolvedValue({
      recordedSuccessfully: true,
    });

    // Inject mocks
    const originalModule = await import(
      "../../src/logic/confirmation-email-generation"
    );
    (originalModule as any).determineManagerEmailRecipients =
      mockDetermineManagerEmailRecipients;
    (originalModule as any).buildManagerConfirmationEmailContent =
      mockBuildManagerConfirmationEmailContent;
    (originalModule as any).sendEmailWithRetry = mockSendEmailWithRetry;
    (originalModule as any).recordEmailSendingHistory =
      mockRecordEmailSendingHistory;

    // Act
    const result = await generateAndSendManagerConfirmationEmail(
      managerUserId,
      aggregationDate,
      unsubmittedMembers,
      prioritizedIssues,
      submissionDeadline,
      teamId
    );

    // Assert
    expect(result.sendingStatus).toBe("success");
    expect(result.messageId).toBe("MSG-20260115-001");
    expect(result.sentDateTime).toBeDefined();
    expect(mockBuildManagerConfirmationEmailContent).toHaveBeenCalledWith(
      expect.objectContaining({
        issues: [],
        unsubmittedMembers: [],
      })
    );
    expect(mockEmailContent.body).toContain(
      "本日の報告がまだ提出されていません。朝会前に確認してください"
    );
    expect(mockSendEmailWithRetry).toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).toHaveBeenCalled();
  });
});