import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { generateAndSendManagerConfirmationEmail } from "../../src/logic/confirmation-email-generation";

describe("confirmation-email-generation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-279
  test("should generate and send manager confirmation email with unsubmitted members and prioritized issues on report aggregation completion", async () => {
    const mockBuildEmailContent = jest.fn().mockResolvedValue({
      subject: "朝会報告集約結果 - 2026年8月19日",
      body: `
        <h2>朝会報告集約結果</h2>
        <h3>提出済み報告一覧（9件）</h3>
        <p>9名のメンバーから報告を受け取りました。</p>
        <h3>未提出者リスト</h3>
        <ul>
          <li>田中太郎（EMP010）</li>
        </ul>
        <h3>優先度付き課題一覧</h3>
        <ul>
          <li><strong>システム障害</strong>（優先度: 高） - 発生回数: 3</li>
          <li><strong>ネットワーク遅延</strong>（優先度: 中） - 発生回数: 2</li>
          <li><strong>ドキュメント未整備</strong>（優先度: 低） - 発生回数: 1</li>
        </ul>
      `,
      generatedAt: new Date("2026-08-19T09:05:00Z"),
    });

    const mockDetermineRecipients = jest.fn().mockResolvedValue({
      recipients: [
        {
          userId: "MGR001",
          emailAddress: "manager@company.example.com",
          displayName: "山田部長",
          teamId: "TEAM001",
        },
      ],
      recipientCount: 1,
    });

    const mockSendEmailWithRetry = jest.fn().mockResolvedValue({
      success: true,
      messageId: "msg_abc123xyz",
      attemptCount: 1,
    });

    const mockRecordHistory = jest.fn().mockResolvedValue({
      recordedAt: new Date("2026-08-19T09:05:30Z"),
      historyId: "hist_001",
    });

    const input = {
      managerUserId: "MGR001",
      aggregationDate: "2026-08-19",
      submissionDeadline: "2026-08-19T09:00:00Z",
      teamId: "TEAM001",
      unsubmittedMembers: [
        {
          employeeId: "EMP010",
          name: "田中太郎",
          elapsedMinutes: 5,
        },
      ],
      submittedCount: 9,
      totalMemberCount: 10,
      prioritizedIssues: [
        {
          issueId: "ISS001",
          keyword: "システム障害",
          frequency: 3,
          priority: "high" as const,
          colorCode: "#FF0000",
          impactScore: 85,
        },
        {
          issueId: "ISS002",
          keyword: "ネットワーク遅延",
          frequency: 2,
          priority: "medium" as const,
          colorCode: "#FFAA00",
          impactScore: 55,
        },
        {
          issueId: "ISS003",
          keyword: "ドキュメント未整備",
          frequency: 1,
          priority: "low" as const,
          colorCode: "#00AA00",
          impactScore: 30,
        },
      ],
    };

    const result = await generateAndSendManagerConfirmationEmail(
      input,
      {
        buildManagerConfirmationEmailContent: mockBuildEmailContent,
        determineManagerEmailRecipients: mockDetermineRecipients,
        sendEmailWithRetry: mockSendEmailWithRetry,
        recordEmailSendingHistory: mockRecordHistory,
      }
    );

    expect(result.sendingStatus).toBe("success");
    expect(result.sentDateTime).toEqual(new Date("2026-08-19T09:05:30Z"));
    expect(result.messageId).toBe("msg_abc123xyz");
    expect(result.errorMessage).toBeUndefined();

    expect(mockBuildEmailContent).toHaveBeenCalledTimes(1);
    expect(mockBuildEmailContent).toHaveBeenCalledWith(
      expect.objectContaining({
        submittedCount: 9,
        totalMemberCount: 10,
        unsubmittedMembers: expect.arrayContaining([
          expect.objectContaining({
            employeeId: "EMP010",
            name: "田中太郎",
          }),
        ]),
        prioritizedIssues: expect.arrayContaining([
          expect.objectContaining({
            keyword: "システム障害",
            frequency: 3,
            priority: "high",
          }),
          expect.objectContaining({
            keyword: "ネットワーク遅延",
            frequency: 2,
            priority: "medium",
          }),
          expect.objectContaining({
            keyword: "ドキュメント未整備",
            frequency: 1,
            priority: "low",
          }),
        ]),
      })
    );

    expect(mockDetermineRecipients).toHaveBeenCalledTimes(1);
    expect(mockDetermineRecipients).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "TEAM001",
      })
    );

    expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
    expect(mockSendEmailWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "manager@company.example.com",
        subject: expect.stringContaining("朝会報告集約結果"),
      })
    );

    expect(mockRecordHistory).toHaveBeenCalledTimes(1);
    expect(mockRecordHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "manager@company.example.com",
        sendingStatus: "success",
        messageId: "msg_abc123xyz",
      })
    );

    const emailBody = mockSendEmailWithRetry.mock.calls[0][0].body;
    expect(emailBody).toMatch(/提出済み報告一覧.*9/);
    expect(emailBody).toMatch(/未提出者/);
    expect(emailBody).toMatch(/田中太郎/);
    expect(emailBody).toMatch(/システム障害/);
    expect(emailBody).toMatch(/ネットワーク遅延/);
    expect(emailBody).toMatch(/ドキュメント未整備/);
  });
});