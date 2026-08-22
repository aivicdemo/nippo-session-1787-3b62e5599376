import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
import type {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  Tx3Imp1AiClient,
  ExtractedIssue,
  PrioritizedIssue,
  EmailSendStatus,
} from "../../src/agents/tx-3-imp-1/orchestrator";

describe("Tx3Imp1Agent - AI Output Validation", () => {
  // SCEN-066: [error] AI エージェントが不正・曖昧・低確信度のモデル出力を検出して安全に引き継ぐ
  test("should reject low-confidence AI output and escalate to manual review", async () => {
    const reportAggregationId = "agg-20240115-001";
    const analysisExecutionTime = new Date("2024-01-15T08:00:00Z");
    const managerEmail = "manager@company.com";

    const priorityThresholds = {
      highPriorityMinScore: 0.75,
      mediumPriorityMinScore: 0.6,
    };

    // Mock AI client that returns low-confidence output
    const mockAiClient: Tx3Imp1AiClient = {
      async analyzeExtractedIssues(issues: ExtractedIssue[]) {
        // Action 1: Extract issues - returns valid issues
        return {
          extractedIssues: [
            {
              id: "issue-001",
              keyword: "顧客クレーム",
              frequency: 2,
              impactLevel: "high",
            },
            {
              id: "issue-002",
              keyword: "納期遅延",
              frequency: 1,
              impactLevel: undefined, // Missing impact level - ambiguous
            },
          ],
          version: "1.0",
        };
      },

      async judgePriority(
        extractedIssues: ExtractedIssue[],
        thresholds: {
          highPriorityMinScore: number;
          mediumPriorityMinScore: number;
        }
      ) {
        // Action 3: Priority judgment with low confidence
        // This simulates AI output that violates contract constraints
        return {
          prioritizedIssues: [
            {
              id: "issue-001",
              keyword: "顧客クレーム",
              priority: "HIGH",
              confidenceScore: 0.45, // Below threshold (0.6)
              reasoning: "複数の顧客報告があり", // Incomplete reasoning
            },
            {
              id: "issue-002",
              keyword: "納期遅延",
              priority: "UNKNOWN", // Invalid priority value
              confidenceScore: undefined, // Missing confidence
              reasoning: "", // Empty reasoning
            },
          ],
          version: "1.0",
        };
      },

      async generateEmailContent(prioritizedIssues: PrioritizedIssue[]) {
        // Action 4: Email generation - should not be called
        throw new Error("Should not reach email generation");
      },

      async sendConfirmationEmail(
        managerEmail: string,
        emailContent: string
      ) {
        // Action 5: Email sending - should be skipped
        throw new Error("Should not reach email sending");
      },
    };

    const input: Tx3Imp1AgentInput = {
      reportAggregationId,
      analysisExecutionTime,
      managerEmail,
      priorityThresholds,
    };

    // Execute agent
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assertions: Verify escalation occurred
    expect(result.status).toBe("ESCALATED");
    expect(result.escalationReason).toMatch(/確信度/);
    expect(result.escalationReason).toMatch(/0.45/);
    expect(result.escalationReason).toMatch(/0.6/);

    // Verify unhandled issues are captured
    expect(result.unhandledIssues).toBeDefined();
    expect(result.unhandledIssues.length).toBeGreaterThan(0);

    // Verify at least one issue has low confidence detected
    const lowConfidenceIssue = result.unhandledIssues.find(
      (issue) => issue.reason && issue.reason.includes("確信度")
    );
    expect(lowConfidenceIssue).toBeDefined();

    // Verify manual review is required
    expect(result.manualReviewRequired).toBe(true);

    // Verify timestamp is set for audit trail
    expect(result.timestamp).toBeDefined();
    const timestamp = new Date(result.timestamp);
    expect(timestamp instanceof Date).toBe(true);
    expect(timestamp.getTime()).toBeGreaterThan(0);

    // Verify email was NOT sent
    expect(result.emailSendStatus.sent).toBe(false);
    expect(result.emailSendStatus.failureReason).toMatch(/検証失敗|検出|エスカレーション/);

    // Verify audit event is recorded
    expect(result.auditEvent).toBeDefined();
    expect(result.auditEvent.eventType).toBe("AI_OUTPUT_REJECTED");
    expect(result.auditEvent.reason).toMatch(/LOW_CONFIDENCE|AMBIGUOUS|MALFORMED/);
    expect(result.auditEvent.requestId).toBeDefined();
    expect(result.auditEvent.timestamp).toBeDefined();
  });
});