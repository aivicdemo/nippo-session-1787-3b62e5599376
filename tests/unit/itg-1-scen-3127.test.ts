import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { runTx3Imp1Agent, type Tx3Imp1AiClient } from "../../src/agents/tx-3-imp-1/orchestrator";
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput } from "../../src/agents/tx-3-imp-1/types";

describe("tx-3-imp-1 orchestrator - partial rollback on mid-action failure", () => {
  // SCEN-3127
  test("should rollback partial side effects when Action 3 fails and compensate appropriately", async () => {
    const aggregatedReportIds = [
      "report-001",
      "report-002",
      "report-003",
    ];
    const analysisStartDate = "2024-01-15T00:00:00Z";
    const analysisEndDate = "2024-01-15T23:59:59Z";
    const managerUserId = "user-manager-001";
    const priorityThresholdScore = 70;

    const input: Tx3Imp1AgentInput = {
      aggregatedReportIds,
      analysisStartDate,
      analysisEndDate,
      managerUserId,
      priorityThresholdScore,
    };

    // Track side effects that were persisted during Action 1 and Action 2
    const persistedKeywordExtractionResults: Record<string, unknown> = {};
    const persistedCategoryClassificationResults: Record<string, unknown> = {};
    const executedRollbacks: string[] = [];
    const auditLogEntries: string[] = [];

    // Fake AI Client implementation
    const fakeAiClient: Tx3Imp1AiClient = {
      async executeAction01_ExtractKeywords(reportData: unknown): Promise<unknown> {
        // Action 1: Successfully extract keywords
        const extractionResult = {
          keywords: [
            { term: "API integration", frequency: 5, confidence: 0.92 },
            { term: "database performance", frequency: 3, confidence: 0.88 },
            { term: "deployment delay", frequency: 2, confidence: 0.85 },
          ],
          totalReportsAnalyzed: 10,
          extractionTimestamp: "2024-01-15T09:00:00Z",
        };
        // Simulate persisting extraction result
        persistedKeywordExtractionResults["action-1"] = extractionResult;
        return extractionResult;
      },

      async executeAction02_ClassifyCategories(
        extractedKeywords: unknown
      ): Promise<unknown> {
        // Action 2: Successfully classify into categories
        const classificationResult = {
          categories: [
            {
              name: "Infrastructure",
              issues: ["API integration", "database performance"],
              count: 2,
            },
            {
              name: "Deployment",
              issues: ["deployment delay"],
              count: 1,
            },
          ],
          classificationTimestamp: "2024-01-15T09:05:00Z",
        };
        // Simulate persisting classification result
        persistedCategoryClassificationResults["action-2"] = classificationResult;
        return classificationResult;
      },

      async executeAction03_AssessImpactScore(
        classifiedCategories: unknown
      ): Promise<unknown> {
        // Action 3: Intentionally fail with timeout error
        const error = new Error("TextAnalysisServiceAdapter timeout: assessImpactScore failed after 30000ms");
        error.name = "ServiceTimeoutError";
        throw error;
      },

      async executeAction04_RollbackPersistentState(
        affectedActions: string[]
      ): Promise<unknown> {
        // Action 4: Execute rollback
        for (const action of affectedActions) {
          if (action === "action-1") {
            delete persistedKeywordExtractionResults["action-1"];
            executedRollbacks.push("rolled_back_action_1_keyword_extraction");
          }
          if (action === "action-2") {
            delete persistedCategoryClassificationResults["action-2"];
            executedRollbacks.push("rolled_back_action_2_category_classification");
          }
        }
        auditLogEntries.push("tx_3_imp_1: 部分的副作用のロールバック実行");
        return {
          rolledBackActions: affectedActions,
          rollbackTimestamp: "2024-01-15T09:10:00Z",
          compensationApplied: true,
        };
      },

      async executeAction05_SendConfirmationEmail(
        emailPayload: unknown
      ): Promise<unknown> {
        // Action 5: This should NOT be called if Action 3 failed
        throw new Error("Action 5 should not execute after Action 3 failure");
      },
    };

    // Execute the agent with failure scenario
    let caughtError: Error | null = null;
    let agentOutput: Tx3Imp1AgentOutput | null = null;

    try {
      agentOutput = await runTx3Imp1Agent(input, fakeAiClient);
    } catch (error) {
      if (error instanceof Error) {
        caughtError = error;
      }
    }

    // Verify Action 1 and Action 2 were executed and their results were persisted
    expect(persistedKeywordExtractionResults).toHaveProperty("action-1");
    expect(persistedKeywordExtractionResults["action-1"]).toEqual(
      expect.objectContaining({
        keywords: expect.any(Array),
        totalReportsAnalyzed: 10,
      })
    );

    expect(persistedCategoryClassificationResults).toHaveProperty("action-2");
    expect(persistedCategoryClassificationResults["action-2"]).toEqual(
      expect.objectContaining({
        categories: expect.any(Array),
      })
    );

    // Verify Action 3 failed with timeout error
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/timeout/i);

    // Verify rollback was executed for Action 1 and Action 2
    expect(executedRollbacks).toContain("rolled_back_action_1_keyword_extraction");
    expect(executedRollbacks).toContain("rolled_back_action_2_category_classification");
    expect(executedRollbacks.length).toBe(2);

    // Verify side effects were actually removed
    expect(persistedKeywordExtractionResults).not.toHaveProperty("action-1");
    expect(persistedCategoryClassificationResults).not.toHaveProperty("action-2");

    // Verify audit log contains rollback entry
    expect(auditLogEntries).toContain("tx_3_imp_1: 部分的副作用のロールバック実行");

    // Verify agent output indicates failure state
    expect(agentOutput).toBeNull();

    // Verify no orphaned data persists
    expect(Object.keys(persistedKeywordExtractionResults).length).toBe(0);
    expect(Object.keys(persistedCategoryClassificationResults).length).toBe(0);
  });
});