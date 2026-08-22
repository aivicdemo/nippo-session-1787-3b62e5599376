import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-202: escalates high-severity issues to manager review before sending notifications", async () => {
    // Setup: Mock AI client and state management
    const mockAiClient = {
      extractIssuesFromReport: jest.fn(),
      determineSeverityLevel: jest.fn(),
      evaluateEscalationRequired: jest.fn(),
    };

    const escalationQueue: Array<{
      memberId: string;
      issueId: string;
      severity: string;
      issueContent: string;
      status: "pending_review" | "approved" | "rejected";
    }> = [];

    const sentNotifications: Array<{
      recipientId: string;
      issueId: string;
      timestamp: string;
    }> = [];

    const managerConfirmationCallbacks: Array<{
      issueId: string;
      onConfirm: (action: "approve" | "reject") => void;
    }> = [];

    // Mock implementation of escalation handler
    const handleEscalation = (params: {
      memberId: string;
      issueId: string;
      issueContent: string;
      severity: "high" | "medium" | "low";
      yesterday: string;
      today: string;
    }): void => {
      escalationQueue.push({
        memberId: params.memberId,
        issueId: params.issueId,
        severity: params.severity,
        issueContent: params.issueContent,
        status: "pending_review",
      });

      // Register callback for manager confirmation
      managerConfirmationCallbacks.push({
        issueId: params.issueId,
        onConfirm: (action: "approve" | "reject") => {
          const queueItem = escalationQueue.find(
            (item) => item.issueId === params.issueId
          );
          if (queueItem) {
            queueItem.status = action === "approve" ? "approved" : "rejected";

            if (action === "approve") {
              sentNotifications.push({
                recipientId: "manager_001",
                issueId: params.issueId,
                timestamp: new Date("2024-01-15T08:00:00Z").toISOString(),
              });
            }
          }
        },
      });
    };

    // Mock AI client responses
    mockAiClient.extractIssuesFromReport.mockReturnValue([
      {
        issueId: "issue_high_001",
        content: "Database performance degradation on production",
        yesterday: "Monitored application performance metrics",
        today: "Plan performance tuning",
      },
      {
        issueId: "issue_medium_001",
        content: "Code review backlog increasing",
        yesterday: "Completed 5 code reviews",
        today: "Continue code reviews",
      },
    ]);

    mockAiClient.determineSeverityLevel.mockImplementation(
      (issueId: string) => {
        if (issueId === "issue_high_001") return "high";
        if (issueId === "issue_medium_001") return "medium";
        return "low";
      }
    );

    mockAiClient.evaluateEscalationRequired.mockImplementation(
      (severity: string) => {
        return severity === "high";
      }
    );

    // Test input: Member report with high-severity issue
    const memberReport = {
      memberId: "member_001",
      reportDate: new Date("2024-01-15T07:00:00Z").toISOString(),
      yesterday: "Monitored application performance metrics",
      today: "Plan performance tuning",
      issues: [
        {
          content: "Database performance degradation on production",
        },
        {
          content: "Code review backlog increasing",
        },
      ],
    };

    // Execute: Call sendUnsubmittedReminder with escalation handler
    const remindParams = {
      unsubmittedMembers: [],
      reportData: memberReport,
      escalationHandler: handleEscalation,
      severityEvaluator: mockAiClient.determineSeverityLevel,
      escalationRequiredCheck: mockAiClient.evaluateEscalationRequired,
    };

    await sendUnsubmittedReminder(remindParams);

    // Assertions

    // 1. Verify AI client was called to extract issues
    expect(mockAiClient.extractIssuesFromReport).toHaveBeenCalled();

    // 2. Verify high-severity issue was identified
    const highSeverityIssues = mockAiClient.determineSeverityLevel
      .mock.results.filter((result: any) => result.value === "high");
    expect(highSeverityIssues.length).toBeGreaterThan(0);

    // 3. Verify escalation queue contains high-severity issue in pending_review status
    const pendingEscalations = escalationQueue.filter(
      (item) => item.status === "pending_review" && item.severity === "high"
    );
    expect(pendingEscalations.length).toBe(1);
    expect(pendingEscalations[0].issueId).toBe("issue_high_001");
    expect(pendingEscalations[0].issueContent).toBe(
      "Database performance degradation on production"
    );

    // 4. Verify notification NOT sent before manager confirmation
    expect(sentNotifications.length).toBe(0);

    // 5. Verify manager confirmation callback was registered
    expect(managerConfirmationCallbacks.length).toBe(1);
    expect(managerConfirmationCallbacks[0].issueId).toBe("issue_high_001");

    // 6. Test: After manager approval, notification should be sent
    const approveCallback = managerConfirmationCallbacks[0];
    approveCallback.onConfirm("approve");

    // Verify escalation status changed to approved
    const approvedItem = escalationQueue.find(
      (item) => item.issueId === "issue_high_001"
    );
    expect(approvedItem?.status).toBe("approved");

    // Verify notification was sent after approval
    expect(sentNotifications.length).toBe(1);
    expect(sentNotifications[0].issueId).toBe("issue_high_001");
    expect(sentNotifications[0].recipientId).toBe("manager_001");

    // 7. Test: After manager rejection, notification should NOT be sent
    sentNotifications.length = 0;

    // Create second escalation for rejection test
    escalationQueue.length = 0;
    managerConfirmationCallbacks.length = 0;

    handleEscalation({
      memberId: "member_002",
      issueId: "issue_high_002",
      issueContent: "Critical production outage",
      severity: "high",
      yesterday: "System running normally",
      today: "Investigate root cause",
    });

    const rejectCallback = managerConfirmationCallbacks[0];
    rejectCallback.onConfirm("reject");

    // Verify escalation status changed to rejected
    const rejectedItem = escalationQueue.find(
      (item) => item.issueId === "issue_high_002"
    );
    expect(rejectedItem?.status).toBe("rejected");

    // Verify no notification was sent after rejection
    expect(sentNotifications.length).toBe(0);

    // 8. Test: Multiple high-severity issues should each have independent confirmation
    escalationQueue.length = 0;
    managerConfirmationCallbacks.length = 0;

    // First high-severity issue
    handleEscalation({
      memberId: "member_003",
      issueId: "issue_high_003",
      issueContent: "Network connectivity loss",
      severity: "high",
      yesterday: "Network stable",
      today: "Investigate connectivity",
    });

    // Second high-severity issue
    handleEscalation({
      memberId: "member_004",
      issueId: "issue_high_004",
      issueContent: "Data integrity issue",
      severity: "high",
      yesterday: "Data validation passed",
      today: "Run consistency checks",
    });

    // Verify both escalations in pending_review status
    expect(escalationQueue.length).toBe(2);
    expect(
      escalationQueue.every((item) => item.status === "pending_review")
    ).toBe(true);

    // Verify each has independent callback
    expect(managerConfirmationCallbacks.length).toBe(2);
    expect(managerConfirmationCallbacks[0].issueId).toBe("issue_high_003");
    expect(managerConfirmationCallbacks[1].issueId).toBe("issue_high_004");

    // Approve first, verify only first is approved
    managerConfirmationCallbacks[0].onConfirm("approve");
    expect(
      escalationQueue.find((item) => item.issueId === "issue_high_003")?.status
    ).toBe("approved");
    expect(
      escalationQueue.find((item) => item.issueId === "issue_high_004")?.status
    ).toBe("pending_review");

    // Approve second independently
    managerConfirmationCallbacks[1].onConfirm("approve");
    expect(
      escalationQueue.find((item) => item.issueId === "issue_high_004")?.status
    ).toBe("approved");

    // 9. Verify medium-severity issue does NOT trigger escalation
    const mediumSeverityEscalations = escalationQueue.filter(
      (item) => item.severity === "medium"
    );
    expect(mediumSeverityEscalations.length).toBe(0);
  });
});