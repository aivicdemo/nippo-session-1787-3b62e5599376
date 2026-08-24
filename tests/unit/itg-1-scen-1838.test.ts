import { runTx7Imp1Agent } from "../../src/agents/tx-7-imp-1/orchestrator";
import type {
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
} from "../../src/agents/tx-7-imp-1/orchestrator";
import type { Tx7Imp1AiClient } from "../../src/agents/tx-7-imp-1/orchestrator";

describe("tx-7-imp-1: 月次課題傾向分析レポート生成", () => {
  // SCEN-1838
  test("3回目の再試行に成功した場合、レポート生成が完了し部長へのエスカレーションは発生しない", async () => {
    const triggerTimestamp = new Date("2024-01-01T09:00:00Z");
    const targetMonth = "2024-01";
    const managerUserId = "user-001";

    let apiCallCount = 0;
    const retryAttempts: { timestamp: Date; attempt: number }[] = [];
    const escalationNotifications: string[] = [];

    const mockAiClient: Tx7Imp1AiClient = {
      extractKeywordsAndAssessImpact: async () => {
        apiCallCount++;
        retryAttempts.push({
          timestamp: new Date(),
          attempt: apiCallCount,
        });

        if (apiCallCount === 1) {
          throw new Error("API timeout");
        }
        if (apiCallCount === 2) {
          throw new Error("API timeout");
        }

        return {
          keywords: [
            {
              keyword: "デプロイ失敗",
              frequency: 5,
              impactScore: 85,
              severity: "high",
            },
            {
              keyword: "DB接続エラー",
              frequency: 3,
              impactScore: 72,
              severity: "medium",
            },
          ],
        };
      },
      analyzeBottleneckTrend: async () => {
        return {
          timeSeriesData: [
            {
              date: "2024-01-01",
              severity: 65,
              impactedAreas: ["backend", "devops"],
            },
            {
              date: "2024-01-08",
              severity: 58,
              impactedAreas: ["backend"],
            },
            {
              date: "2024-01-15",
              severity: 72,
              impactedAreas: ["backend", "database"],
            },
            {
              date: "2024-01-22",
              severity: 55,
              impactedAreas: ["devops"],
            },
            {
              date: "2024-01-29",
              severity: 48,
              impactedAreas: ["frontend"],
            },
          ],
          improvementTrend: "improving",
          recurringIssuePattern: ["デプロイ失敗", "DB接続エラー"],
        };
      },
      calculateTeamPerformanceMetrics: async () => {
        return {
          teamId: "team-dev-001",
          teamName: "Development Team",
          issueResolutionSpeed: 3.2,
          reportSubmissionRate: 0.92,
          issueRecurrenceRate: 0.18,
          averageResolutionDays: 3,
        };
      },
      sendReportToManager: async () => {
        return {
          deliveryStatus: "sent",
          recipientEmail: "manager@company.com",
          sentAt: new Date("2024-01-01T10:30:00Z"),
        };
      },
      notifyEscalation: async () => {
        escalationNotifications.push("escalation_sent");
        return { escalationStatus: "sent" };
      },
      recordAuditLog: async () => {
        return { auditId: "audit-001" };
      },
      validateMonthlyDataQuality: async () => {
        return {
          isValid: true,
          recordCount: 150,
          dataQualityScore: 0.88,
        };
      },
    };

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe("success");
    expect(result.reportId).toBeDefined();
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.deliveryTimestamp).toEqual(
      new Date("2024-01-01T10:30:00Z")
    );

    expect(apiCallCount).toBe(3);
    expect(retryAttempts.length).toBe(3);
    expect(retryAttempts[0].attempt).toBe(1);
    expect(retryAttempts[1].attempt).toBe(2);
    expect(retryAttempts[2].attempt).toBe(3);

    expect(result.analysisResultSummary).toBeDefined();
    expect(result.analysisResultSummary.topPriorityChallenges).toBeDefined();
    expect(result.analysisResultSummary.topPriorityChallenges.length).toBeGreaterThan(
      0
    );

    const topChallenge = result.analysisResultSummary.topPriorityChallenges[0];
    expect(topChallenge.challengeId).toBeDefined();
    expect(topChallenge.priorityScore).toBe(85);
    expect(topChallenge.occurrenceFrequency).toBe(5);
    expect(topChallenge.impactLevel).toBe("高");
    expect(topChallenge.resolutionDaysAverage).toBe(3);

    expect(
      result.analysisResultSummary.bottleneckTrend.improvementTrend
    ).toBe("improving");
    expect(
      result.analysisResultSummary.bottleneckTrend.recurringIssuePattern
    ).toContain("デプロイ失敗");
    expect(
      result.analysisResultSummary.bottleneckTrend.recurringIssuePattern
    ).toContain("DB接続エラー");

    expect(result.analysisResultSummary.performanceMetrics).toBeDefined();
    expect(result.analysisResultSummary.performanceMetrics.teamId).toBe(
      "team-dev-001"
    );
    expect(result.analysisResultSummary.performanceMetrics.issueResolutionSpeed).toBe(3.2);
    expect(
      result.analysisResultSummary.performanceMetrics.reportSubmissionRate
    ).toBe(0.92);

    expect(escalationNotifications.length).toBe(0);
  });
});