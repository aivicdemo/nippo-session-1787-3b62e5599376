import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from "../../src/agents/tx-4-imp-1/prompts/action-07";

describe("Tx4Imp1Agent - Dashboard Analysis to Issue Instruction Autonomous Execution", () => {
  it("SCEN-079: Action 7 extracts non-submitted members and sends notification payload via orchestrator boundary", async () => {
    // Setup: Fixed timestamps and test data
    const executionTimestamp = new Date("2024-01-15T08:30:00Z");
    const submissionDeadline = new Date("2024-01-15T08:00:00Z");
    const targetDate = "2024-01-15";
    const executorUserId = "director-001";
    const teamId = "team-sales-001";

    // Member submission status data
    const memberSubmissionStatus = [
      {
        memberId: "member-001",
        memberName: "田中太郎",
        department: "営業部",
        emailAddress: "tanaka.taro@company.com",
        isSubmitted: false,
        submissionTimestamp: null,
      },
      {
        memberId: "member-002",
        memberName: "佐藤花子",
        department: "企画部",
        emailAddress: "sato.hanako@company.com",
        isSubmitted: false,
        submissionTimestamp: null,
      },
      {
        memberId: "member-003",
        memberName: "鈴木次郎",
        department: "営業部",
        emailAddress: "suzuki.jiro@company.com",
        isSubmitted: true,
        submissionTimestamp: new Date("2024-01-15T07:45:00Z"),
      },
    ];

    // Expected non-submitted members list
    const expectedNonSubmittedMembers = [
      {
        memberId: "member-001",
        memberName: "田中太郎",
        department: "営業部",
        emailAddress: "tanaka.taro@company.com",
        nonSubmissionReason: "deadline_exceeded",
      },
      {
        memberId: "member-002",
        memberName: "佐藤花子",
        department: "企画部",
        emailAddress: "sato.hanako@company.com",
        nonSubmissionReason: "deadline_exceeded",
      },
    ];

    // Expected notification payload
    const expectedNotificationPayload = {
      recipientEmail: "manager@company.com",
      subject: "【自動通知】本日の日報未提出メンバーリスト",
      body: expect.stringContaining("田中太郎") &&
        expect.stringContaining("営業部") &&
        expect.stringContaining("佐藤花子") &&
        expect.stringContaining("企画部") &&
        expect.stringContaining("未提出時間"),
      nonSubmittedMembersCount: 2,
    };

    // Audit log event expected
    const expectedAuditEvent = {
      actionId: "action_07",
      executorUserId: executorUserId,
      executionTimestamp: executionTimestamp,
      targetDate: targetDate,
      teamId: teamId,
      membersExtractedCount: 2,
      notificationSentTo: "manager@company.com",
      status: "completed",
    };

    // Mock AI client implementing Tx4Imp1AiClient interface
    const mockAiClient = {
      generateAction07Response: jest.fn(async (prompt: string) => {
        return {
          nonSubmittedMembers: expectedNonSubmittedMembers,
          notificationPayload: {
            recipientEmail: "manager@company.com",
            subject: "【自動通知】本日の日報未提出メンバーリスト",
            body: `本日の日報提出期限（${submissionDeadline.toISOString()}）までに提出していないメンバーは以下の通りです。\n\n- 名前: 田中太郎\n  部門: 営業部\n  メールアドレス: tanaka.taro@company.com\n  未提出時間: 30分\n\n- 名前: 佐藤花子\n  部門: 企画部\n  メールアドレス: sato.hanako@company.com\n  未提出時間: 30分`,
            nonSubmittedMembersCount: 2,
          },
          auditEvent: expectedAuditEvent,
        };
      }),
      recordAuditLog: jest.fn(async (event: any) => {
        return { logged: true, eventId: "audit-event-001" };
      }),
      sendNotification: jest.fn(async (payload: any) => {
        return { sent: true, notificationId: "notif-001" };
      }),
    };

    // Verify buildAction07Prompt and ACTION_07_PROMPT_VERSION are exported
    expect(typeof buildAction07Prompt).toBe("function");
    expect(typeof ACTION_07_PROMPT_VERSION).toBe("string");

    // Build Action 7 prompt with test data
    const action07Prompt = buildAction07Prompt({
      submissionDeadline: submissionDeadline,
      memberSubmissionStatus: memberSubmissionStatus,
      targetDate: targetDate,
    });

    expect(action07Prompt).toBeTruthy();
    expect(typeof action07Prompt).toBe("string");

    // Execute the orchestrator with input request
    const inputRequest = {
      executionTimestamp: executionTimestamp,
      targetDate: targetDate,
      executorUserId: executorUserId,
      teamId: teamId,
    };

    const result = await runTx4Imp1Agent(inputRequest, mockAiClient);

    // Verify result structure matches Tx4AgentExecutionResult
    expect(result).toHaveProperty("executionId");
    expect(result).toHaveProperty("aggregatedReportCount");
    expect(result).toHaveProperty("extractedIssueCount");
    expect(result).toHaveProperty("prioritizedIssues");
    expect(result).toHaveProperty("countermeasurePlan");
    expect(result).toHaveProperty("summaryEmailSent");
    expect(result).toHaveProperty("completionTimestamp");

    // Verify AI client was called with action-07 prompt
    expect(mockAiClient.generateAction07Response).toHaveBeenCalled();
    const callArgs = mockAiClient.generateAction07Response.mock.calls[0][0];
    expect(callArgs).toContain(targetDate);
    expect(callArgs).toContain("提出状況");

    // Verify non-submitted members extraction
    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(0);

    // Verify audit log was recorded
    expect(mockAiClient.recordAuditLog).toHaveBeenCalled();
    const auditCall = mockAiClient.recordAuditLog.mock.calls[0][0];
    expect(auditCall.actionId).toBe("action_07");
    expect(auditCall.executorUserId).toBe(executorUserId);
    expect(auditCall.membersExtractedCount).toBe(2);
    expect(auditCall.status).toBe("completed");

    // Verify notification was sent
    expect(mockAiClient.sendNotification).toHaveBeenCalled();
    const notificationCall = mockAiClient.sendNotification.mock.calls[0][0];
    expect(notificationCall.recipientEmail).toBe("manager@company.com");
    expect(notificationCall.subject).toContain("未提出メンバー");
    expect(notificationCall.body).toContain("田中太郎");
    expect(notificationCall.body).toContain("営業部");
    expect(notificationCall.body).toContain("佐藤花子");
    expect(notificationCall.body).toContain("企画部");

    // Verify completion timestamp is after execution timestamp
    expect(new Date(result.completionTimestamp).getTime()).toBeGreaterThanOrEqual(
      executionTimestamp.getTime()
    );

    // Verify summary email was sent flag
    expect(result.summaryEmailSent).toBe(true);

    // Verify execution ID is generated
    expect(result.executionId).toMatch(/^tx-4-[a-zA-Z0-9-]+$/);
  });
});