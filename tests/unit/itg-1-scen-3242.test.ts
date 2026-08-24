import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";

describe("tx-11-imp-1: 日報収集・確認・催促の自動化エージェント", () => {
  // SCEN-3242
  test("同一課題が複数回発生した場合に対応方針の見直しを提案し、副作用確定前に人へ引き継ぐ", async () => {
    // Test fixture: 過去30日間に同一課題が3回発生したシナリオ
    const executionTimestamp = new Date("2024-12-15T08:30:00Z");
    const teamId = "team-dev-001";
    const reportDeadlineTime = "09:00";
    const managerEmail = "manager@example.com";

    // Recurring issue data: "データベース接続エラー" が3回発生
    const recurringIssueDates = [
      new Date("2024-12-13T08:15:00Z"),
      new Date("2024-12-14T08:20:00Z"),
      new Date("2024-12-15T08:10:00Z"),
    ];

    // Mock AI client stub with escalation behavior
    const mockAiClient = {
      extractAndPrioritizeIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: "db-connection-error",
            title: "データベース接続エラー",
            description: "本番環境のDB接続タイムアウト",
            occurrenceCount: 3,
            occurrenceDates: recurringIssueDates,
            frequencyScore: 85,
            impactScore: 92,
            priorityScore: 88,
          },
        ],
        analysisMetadata: {
          modelVersion: "gpt-5.6-test",
          confidenceLevel: 0.95,
        },
      }),

      generateManagerSummary: jest.fn().mockResolvedValue({
        summaryContent: "朝会用サマリー",
        timestamp: executionTimestamp.toISOString(),
      }),

      detectEscalationCondition: jest.fn().mockResolvedValue({
        isEscalationTriggered: true,
        escalationType: "RECURRING_ISSUE_REVIEW_NEEDED",
        proposedSolution: "対応方針の見直し必要",
        reasoning:
          "同一課題（DB接続エラー）が3日連続で発生。根本原因の検討と恒久対策の立案が必要。",
      }),
    };

    // Mock notification service adapter (should NOT be called during escape)
    const mockNotificationService = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Mock text analysis service adapter (should complete before escape)
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["データベース", "接続エラー", "タイムアウト"],
        frequencies: [3, 3, 2],
      }),

      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 92,
        affectedComponents: ["生産DB", "ユーザー認証"],
      }),

      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "HIGH",
        category: "システム障害",
      }),
    };

    // State container to capture escape-to-human-review state
    const capturedState = {
      pendingReviewState: null as any,
      notificationQueue: [] as any[],
      statusUpdateQueue: [] as any[],
      escapeToHumanReviewCalled: false,
    };

    // Mock escapeToHumanReview function
    const mockEscapeToHumanReview = jest.fn(
      async (escapeReason, proposedSolution, recurringIssueDetails) => {
        capturedState.escapeToHumanReviewCalled = true;
        capturedState.pendingReviewState = {
          escapeReason,
          proposedSolution,
          recurringIssueDetails,
          capturedAt: new Date().toISOString(),
          notificationQueueSnapshot: [...capturedState.notificationQueue],
          statusUpdateQueueSnapshot: [...capturedState.statusUpdateQueue],
        };
        return { status: "PENDING_HUMAN_REVIEW", reviewId: "review-001" };
      }
    );

    // Inject orchestrated AI client with escape handler
    const orchestratedAiClient = {
      ...mockAiClient,
      escapeToHumanReview: mockEscapeToHumanReview,
    } as any;

    // Prepare input context
    const executionContext = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      morningMeetingStartTime: "10:00",
    };

    const agentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    // Execute the agent with mocked dependencies
    const result = await runTx11Imp1Agent(agentInput, orchestratedAiClient);

    // ASSERTION 1: escapeToHumanReview was called
    expect(mockEscapeToHumanReview).toHaveBeenCalled();
    expect(capturedState.escapeToHumanReviewCalled).toBe(true);

    // ASSERTION 2: Verify pending review state contains correct escalation details
    expect(capturedState.pendingReviewState).toBeDefined();
    expect(capturedState.pendingReviewState.escapeReason).toBe(
      "RECURRING_ISSUE_REVIEW_NEEDED"
    );
    expect(capturedState.pendingReviewState.proposedSolution).toBe(
      "対応方針の見直し必要"
    );

    // ASSERTION 3: Verify recurring issue details are captured
    expect(capturedState.pendingReviewState.recurringIssueDetails).toBeDefined();
    expect(
      capturedState.pendingReviewState.recurringIssueDetails.issueId
    ).toBe("db-connection-error");
    expect(
      capturedState.pendingReviewState.recurringIssueDetails.occurrenceCount
    ).toBe(3);
    expect(
      capturedState.pendingReviewState.recurringIssueDetails.dates
    ).toHaveLength(3);
    expect(
      capturedState.pendingReviewState.recurringIssueDetails.dates[0]
    ).toEqual(recurringIssueDates[0]);
    expect(
      capturedState.pendingReviewState.recurringIssueDetails.dates[2]
    ).toEqual(recurringIssueDates[2]);

    // ASSERTION 4: Verify notification service was NOT called (side effects not committed)
    expect(mockNotificationService.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationService.scheduleNotification).not.toHaveBeenCalled();

    // ASSERTION 5: Verify text analysis service WAS called (pre-escape processing completed)
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisService.classifyIssueSeverity).toHaveBeenCalled();

    // ASSERTION 6: Verify result status indicates human review is pending
    expect(result.executionStatus).toBe("partial_failure");
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.prioritizedIssuesList).toHaveLength(1);
    expect(result.prioritizedIssuesList[0].issueId).toBe("db-connection-error");
    expect(result.prioritizedIssuesList[0].frequencyScore).toBe(85);
    expect(result.prioritizedIssuesList[0].priorityScore).toBe(88);

    // ASSERTION 7: Manager summary email NOT sent (waiting for human review)
    expect(result.managerSummaryEmailSent).toBe(false);

    // ASSERTION 8: Reminder notifications count is 0 (not sent during escape)
    expect(result.reminderNotificationsSent).toBe(0);

    // ASSERTION 9: Verify no side effect queues were committed
    expect(capturedState.notificationQueue).toHaveLength(0);
    expect(capturedState.statusUpdateQueue).toHaveLength(0);
  });
});