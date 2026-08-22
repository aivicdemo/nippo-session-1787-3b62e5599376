import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-182: sendUnsubmittedReminder generates feedback for low-proficiency members based on initial report analysis", async () => {
    // Setup: Test data representing initial report analysis results
    // 9 submitted members + 1 unsubmitted member
    // Quality scores range 0.45-0.95 with average 0.72
    const initialReportAnalysis = {
      totalMembers: 10,
      submittedCount: 9,
      unsubmittedCount: 1,
      averageQualityScore: 0.72,
      memberScores: [
        { memberId: "M001", memberName: "Alice", qualityScore: 0.95, submitted: true },
        { memberId: "M002", memberName: "Bob", qualityScore: 0.88, submitted: true },
        { memberId: "M003", memberName: "Charlie", qualityScore: 0.78, submitted: true },
        { memberId: "M004", memberName: "Diana", qualityScore: 0.72, submitted: true },
        { memberId: "M005", memberName: "Eve", qualityScore: 0.65, submitted: true },
        { memberId: "M006", memberName: "Frank", qualityScore: 0.58, submitted: true },
        { memberId: "M007", memberName: "Grace", qualityScore: 0.52, submitted: true },
        { memberId: "M008", memberName: "Henry", qualityScore: 0.45, submitted: true },
        { memberId: "M009", memberName: "Ivy", qualityScore: 0.68, submitted: true },
        { memberId: "M010", memberName: "Jack", qualityScore: 0.0, submitted: false },
      ],
      extractedChallenges: [
        { keyword: "database-performance", frequency: 3 },
        { keyword: "api-latency", frequency: 2 },
        { keyword: "memory-leak", frequency: 2 },
        { keyword: "logging-issue", frequency: 1 },
      ],
      analysisTimestamp: "2024-01-15T08:00:00Z",
    };

    const unsubmittedMembers = [
      {
        memberId: "M010",
        memberName: "Jack",
        email: "jack@example.com",
        submissionDeadline: "2024-01-15T09:00:00Z",
      },
    ];

    const lowProficiencyThreshold = 0.60;
    const feedbackTargetMembers = initialReportAnalysis.memberScores.filter(
      (m) => m.submitted && m.qualityScore < lowProficiencyThreshold,
    );

    expect(feedbackTargetMembers).toHaveLength(3);
    expect(feedbackTargetMembers[0].qualityScore).toBe(0.45);
    expect(feedbackTargetMembers[1].qualityScore).toBe(0.52);
    expect(feedbackTargetMembers[2].qualityScore).toBe(0.58);

    // Execute sendUnsubmittedReminder
    const result = await sendUnsubmittedReminder({
      unsubmittedMembers,
      analysisContext: initialReportAnalysis,
      departmentId: "DEPT-A",
      executionTimestamp: "2024-01-15T09:30:00Z",
    });

    // Verify core response structure
    expect(result).toBeDefined();
    expect(result.remindersSent).toBe(1);
    expect(result.unsubmittedCount).toBe(1);

    // Verify unsubmitted member notifications
    expect(result.notificationDetails).toHaveLength(1);
    expect(result.notificationDetails[0].memberId).toBe("M010");
    expect(result.notificationDetails[0].status).toBe("sent");

    // Verify feedback generation for low-proficiency members (Action 5 autonomous action)
    expect(result.feedbackGenerated).toBe(true);
    expect(result.feedbackTargets).toHaveLength(3);

    // Validate feedback structure for each low-proficiency member
    const feedbackData = result.feedbackTargets;

    // Henry (M008): lowest score 0.45
    const henryFeedback = feedbackData.find((f) => f.memberId === "M008");
    expect(henryFeedback).toBeDefined();
    expect(henryFeedback?.memberName).toBe("Henry");
    expect(henryFeedback?.proficiencyScore).toBe(0.45);
    expect(henryFeedback?.riskLevel).toBe("high");
    expect(henryFeedback?.identifiedChallenges).toContain("database-performance");
    expect(henryFeedback?.recommendedActions).toHaveLength(3);
    expect(henryFeedback?.recommendedActions[0]).toContain("hands-on");

    // Grace (M007): middle score 0.52
    const graceFeedback = feedbackData.find((f) => f.memberId === "M007");
    expect(graceFeedback).toBeDefined();
    expect(graceFeedback?.memberName).toBe("Grace");
    expect(graceFeedback?.proficiencyScore).toBe(0.52);
    expect(graceFeedback?.riskLevel).toBe("medium");
    expect(graceFeedback?.recommendedActions).toHaveLength(2);

    // Frank (M006): higher score 0.58
    const frankFeedback = feedbackData.find((f) => f.memberId === "M006");
    expect(frankFeedback).toBeDefined();
    expect(frankFeedback?.memberName).toBe("Frank");
    expect(frankFeedback?.proficiencyScore).toBe(0.58);
    expect(frankFeedback?.riskLevel).toBe("medium");
    expect(frankFeedback?.recommendedActions).toHaveLength(1);

    // Verify feedback content is based on extracted challenges
    feedbackData.forEach((feedback) => {
      expect(Array.isArray(feedback.identifiedChallenges)).toBe(true);
      expect(feedback.identifiedChallenges.length).toBeGreaterThan(0);
      feedback.identifiedChallenges.forEach((challenge: string) => {
        const challengeKeywords = initialReportAnalysis.extractedChallenges.map(
          (c) => c.keyword,
        );
        expect(challengeKeywords).toContain(challenge);
      });
    });

    // Verify recommendation actions vary by proficiency score (lower score = higher support intensity)
    const henryRecommendations = henryFeedback?.recommendedActions || [];
    const graceRecommendations = graceFeedback?.recommendedActions || [];
    const frankRecommendations = frankFeedback?.recommendedActions || [];

    expect(henryRecommendations.length).toBeGreaterThan(graceRecommendations.length);
    expect(graceRecommendations.length).toBeGreaterThanOrEqual(frankRecommendations.length);

    // Verify audit log
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.eventType).toBe("UNSUBMITTED_REMINDER_SENT");
    expect(result.auditLog.timestamp).toBe("2024-01-15T09:30:00Z");
    expect(result.auditLog.departmentId).toBe("DEPT-A");
    expect(result.auditLog.dataHash).toBeDefined();
    expect(typeof result.auditLog.dataHash).toBe("string");
    expect(result.auditLog.dataHash.length).toBeGreaterThan(0);
  });
});