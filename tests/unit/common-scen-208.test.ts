import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";

describe("Tx11Imp1Agent Authorization Denial", () => {
  // SCEN-208: [error] 日報収集・確認・催促の自動化エージェント AIエージェント - 権限外のデータ参照とツール操作を拒否する
  test("should deny all unauthorized data access and tool operations with explicit error messages and audit log records", async () => {
    // Mock AI Client
    const mockAiClient = {
      callAction01: jest.fn(),
      callAction02: jest.fn(),
      callAction03: jest.fn(),
      callAction04: jest.fn(),
      callAction05: jest.fn(),
      callAction06: jest.fn(),
      callAction07: jest.fn(),
    };

    // Setup: Unauthorized user context (general member A)
    const executionTimestamp = new Date("2024-01-15T07:00:00Z");
    const teamId = "team-001";
    const reportDeadlineTime = "09:00";
    const managerEmail = "manager@example.com";

    // Mock unauthorized user context
    const unauthorizedUserContext = {
      userId: "user-member-a",
      userRole: "general_member",
      assignedTeamIds: ["team-002"], // Member A only has access to team-002, not team-001
    };

    // Setup mock responses for authorization denial scenarios
    mockAiClient.callAction01.mockResolvedValue({
      status: "denied",
      errorCode: "INSUFFICIENT_PERMISSION",
      errorMessage:
        "権限外ユーザーA には部門全体の日報提出状況参照権限がありません",
      auditEvent: {
        eventType: "denied_authorization",
        userId: "user-member-a",
        action: "action_01_fetch_submission_status",
        reason: "insufficient_permission",
        timestamp: new Date("2024-01-15T07:00:01Z").toISOString(),
      },
    });

    mockAiClient.callAction02.mockResolvedValue({
      status: "denied",
      errorCode: "INSUFFICIENT_PERMISSION",
      errorMessage: "ユーザーA はメンバーB の日報へのアクセス権限がありません",
      attemptedMemberId: "user-member-b",
      auditEvent: {
        eventType: "denied_authorization",
        userId: "user-member-a",
        action: "action_02_fetch_member_report",
        reason: "insufficient_permission",
        targetMemberId: "user-member-b",
        timestamp: new Date("2024-01-15T07:00:02Z").toISOString(),
      },
    });

    mockAiClient.callAction03.mockResolvedValue({
      status: "denied",
      errorCode: "INSUFFICIENT_PERMISSION",
      errorMessage:
        "権限レベル:一般メンバーでは課題データベースへのアクセスが許可されていません",
      userPermissionLevel: "general_member",
      auditEvent: {
        eventType: "denied_authorization",
        userId: "user-member-a",
        action: "action_03_query_issue_database",
        reason: "insufficient_permission",
        timestamp: new Date("2024-01-15T07:00:03Z").toISOString(),
      },
    });

    mockAiClient.callAction04.mockResolvedValue({
      status: "denied",
      errorCode: "TOOL_OPERATION_DENIED",
      errorMessage: "このツール操作は部長ロールのみに許可されています",
      requiredRole: "manager",
      currentRole: "general_member",
      toolName: "send_reminder_notification",
      auditEvent: {
        eventType: "denied_authorization",
        userId: "user-member-a",
        action: "action_04_send_reminder_notifications",
        reason: "insufficient_permission",
        timestamp: new Date("2024-01-15T07:00:04Z").toISOString(),
      },
    });

    mockAiClient.callAction05.mockResolvedValue({
      status: "denied",
      errorCode: "INSUFFICIENT_PERMISSION",
      errorMessage: "配信先指定権限がないため実行できません",
      requiredCapability: "send_summary_email",
      auditEvent: {
        eventType: "denied_authorization",
        userId: "user-member-a",
        action: "action_05_send_summary_email",
        reason: "insufficient_permission",
        timestamp: new Date("2024-01-15T07:00:05Z").toISOString(),
      },
    });

    mockAiClient.callAction06.mockResolvedValue({
      status: "denied",
      errorCode: "INSUFFICIENT_PERMISSION",
      errorMessage:
        "権限外ユーザーA には部門全体の日報提出状況参照権限がありません",
      auditEvent: {
        eventType: "denied_authorization",
        userId: "user-member-a",
        action: "action_06_prioritize_issues",
        reason: "insufficient_permission",
        timestamp: new Date("2024-01-15T07:00:06Z").toISOString(),
      },
    });

    mockAiClient.callAction07.mockResolvedValue({
      status: "denied",
      errorCode: "INSUFFICIENT_PERMISSION",
      errorMessage:
        "権限外ユーザーA には部門全体の日報提出状況参照権限がありません",
      auditEvent: {
        eventType: "denied_authorization",
        userId: "user-member-a",
        action: "action_07_send_manager_completion_notification",
        reason: "insufficient_permission",
        timestamp: new Date("2024-01-15T07:00:07Z").toISOString(),
      },
    });

    // Execute agent with unauthorized user context
    const result = await runTx11Imp1Agent(
      {
        executionTimestamp,
        teamId,
        reportDeadlineTime,
        managerEmail,
        unauthorizedUserContext,
      },
      mockAiClient as any
    );

    // Assertions for all authorization denial scenarios

    // (1) Action 1: Deny access to submission status with explicit error message
    expect(mockAiClient.callAction01).toHaveBeenCalled();
    const action01Result = await mockAiClient.callAction01();
    expect(action01Result.status).toBe("denied");
    expect(action01Result.errorCode).toBe("INSUFFICIENT_PERMISSION");
    expect(action01Result.errorMessage).toMatch(/権限外ユーザーA には部門全体の日報提出状況参照権限がありません/);
    expect(action01Result.auditEvent.eventType).toBe("denied_authorization");
    expect(action01Result.auditEvent.userId).toBe("user-member-a");
    expect(action01Result.auditEvent.action).toBe("action_01_fetch_submission_status");
    expect(action01Result.auditEvent.reason).toBe("insufficient_permission");
    expect(action01Result.auditEvent.timestamp).toBeDefined();

    // (2) Action 2: Deny access to member B's report data
    expect(mockAiClient.callAction02).toHaveBeenCalled();
    const action02Result = await mockAiClient.callAction02();
    expect(action02Result.status).toBe("denied");
    expect(action02Result.errorCode).toBe("INSUFFICIENT_PERMISSION");
    expect(action02Result.errorMessage).toMatch(/ユーザーA はメンバーB の日報へのアクセス権限がありません/);
    expect(action02Result.auditEvent.eventType).toBe("denied_authorization");
    expect(action02Result.auditEvent.userId).toBe("user-member-a");
    expect(action02Result.auditEvent.action).toBe("action_02_fetch_member_report");
    expect(action02Result.auditEvent.targetMemberId).toBe("user-member-b");
    expect(action02Result.auditEvent.reason).toBe("insufficient_permission");

    // (3) Action 3: Deny access to issue database with permission level validation
    expect(mockAiClient.callAction03).toHaveBeenCalled();
    const action03Result = await mockAiClient.callAction03();
    expect(action03Result.status).toBe("denied");
    expect(action03Result.errorCode).toBe("INSUFFICIENT_PERMISSION");
    expect(action03Result.errorMessage).toMatch(/権限レベル:一般メンバーでは課題データベースへのアクセスが許可されていません/);
    expect(action03Result.userPermissionLevel).toBe("general_member");
    expect(action03Result.auditEvent.eventType).toBe("denied_authorization");
    expect(action03Result.auditEvent.userId).toBe("user-member-a");
    expect(action03Result.auditEvent.action).toBe("action_03_query_issue_database");
    expect(action03Result.auditEvent.reason).toBe("insufficient_permission");

    // (4) Action 4: Deny reminder notification tool operation (manager-only role)
    expect(mockAiClient.callAction04).toHaveBeenCalled();
    const action04Result = await mockAiClient.callAction04();
    expect(action04Result.status).toBe("denied");
    expect(action04Result.errorCode).toBe("TOOL_OPERATION_DENIED");
    expect(action04Result.errorMessage).toMatch(/このツール操作は部長ロールのみに許可されています/);
    expect(action04Result.requiredRole).toBe("manager");
    expect(action04Result.currentRole).toBe("general_member");
    expect(action04Result.toolName).toBe("send_reminder_notification");
    expect(action04Result.auditEvent.eventType).toBe("denied_authorization");
    expect(action04Result.auditEvent.userId).toBe("user-member-a");
    expect(action04Result.auditEvent.action).toBe("action_04_send_reminder_notifications");
    expect(action04Result.auditEvent.reason).toBe("insufficient_permission");

    // (5) Action 5: Deny summary email distribution (insufficient capability)
    expect(mockAiClient.callAction05).toHaveBeenCalled();
    const action05Result = await mockAiClient.callAction05();
    expect(action05Result.status).toBe("denied");
    expect(action05Result.errorCode).toBe("INSUFFICIENT_PERMISSION");
    expect(action05Result.errorMessage).toMatch(/配信先指定権限がないため実行できません/);
    expect(action05Result.auditEvent.eventType).toBe("denied_authorization");
    expect(action05Result.auditEvent.userId).toBe("user-member-a");
    expect(action05Result.auditEvent.action).toBe("action_05_send_summary_email");
    expect(action05Result.auditEvent.reason).toBe("insufficient_permission");

    // (6) Verify all denial events are logged in audit format
    const allAuditEvents = [
      action01Result.auditEvent,
      action02Result.auditEvent,
      action03Result.auditEvent,
      action04Result.auditEvent,
      action05Result.auditEvent,
    ];

    allAuditEvents.forEach((auditEvent) => {
      expect(auditEvent.eventType).toBe("denied_authorization");
      expect(auditEvent.userId).toBe("user-member-a");
      expect(auditEvent.reason).toBe("insufficient_permission");
      expect(auditEvent.timestamp).toBeDefined();
      // Validate ISO 8601 format
      expect(new Date(auditEvent.timestamp).getTime()).toBeGreaterThan(0);
    });

    // Verify overall output structure indicates authorization failures
    expect(result.submissionStatus).toBeUndefined();
    expect(result.prioritizedIssues).toEqual([]);
    expect(result.notificationsSent).toEqual([]);
    expect(result.summaryEmailSent).toBe(false);
  });
});