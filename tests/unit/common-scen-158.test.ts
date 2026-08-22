import { runTx8Imp1Agent, type Tx8Imp1AiClient } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("Tx8Imp1Agent", () => {
  // SCEN-158: [error] 課題検索から可視化レポート作成までの自動実行 - 途中失敗時の副作用巻き戻し
  test("should rollback all side effects when Action 4 fails during report generation", async () => {
    // Initialize test stub data
    const issue_1 = {
      id: "issue-001",
      title: "Database Connection Timeout",
      createdAt: "2024-01-10T09:00:00Z",
      priority: "high",
      status: "open",
    };
    const issue_2 = {
      id: "issue-002",
      title: "Database Connection Timeout",
      createdAt: "2024-01-12T14:30:00Z",
      priority: "high",
      status: "open",
    };
    const issue_3 = {
      id: "issue-003",
      title: "API Rate Limit Exceeded",
      createdAt: "2024-01-15T11:00:00Z",
      priority: "medium",
      status: "resolved",
    };

    const initialIssueCount = 3;
    let loadedIssueCount = 0;
    let analysisResultGenerated = false;
    let patternDetectionResultGenerated = false;
    let compensationExecuted = false;
    let rollbackLog: string[] = [];

    // Mock AI client with controlled side effects and error injection
    const mockAiClient: Tx8Imp1AiClient = {
      async searchAndExtractIssues(input: {
        systemUrl: string;
        analysisStartDate: string;
        analysisEndDate: string;
      }): Promise<
        Array<{
          id: string;
          title: string;
          createdAt: string;
          priority: string;
          status: string;
        }>
      > {
        // Action 1: Extract issues from system
        const extractedIssues = [issue_1, issue_2, issue_3];
        loadedIssueCount = extractedIssues.length;
        return extractedIssues;
      },

      async analyzeRecurrencePatterns(input: {
        issues: Array<{ id: string; title: string; createdAt: string }>;
      }): Promise<{
        patterns: Array<{ title: string; occurrences: number }>;
        recurrenceRiskScore: number;
      }> {
        // Action 2: Analyze recurrence patterns
        const patterns = [
          {
            title: "Database Connection Timeout",
            occurrences: 2,
          },
        ];
        analysisResultGenerated = true;
        return {
          patterns,
          recurrenceRiskScore: 0.75,
        };
      },

      async identifyBottleneckPatterns(input: {
        patterns: Array<{ title: string; occurrences: number }>;
      }): Promise<{
        criticalBottlenecks: Array<{ pattern: string; severity: string }>;
        timelineShift: string;
      }> {
        // Action 3: Identify bottleneck patterns
        patternDetectionResultGenerated = true;
        return {
          criticalBottlenecks: [
            { pattern: "Database Connection Timeout", severity: "critical" },
          ],
          timelineShift: "increasing",
        };
      },

      async generateVisualizationReport(input: {
        bottlenecks: Array<{ pattern: string; severity: string }>;
      }): Promise<{
        reportId: string;
        reportContent: string;
      }> {
        // Action 4: Generate report - INTENTIONALLY FAIL HERE
        throw new Error("Database connection failed during report generation");
      },

      async compensateAndRollback(input: {
        failedAction: string;
        completedActions: string[];
      }): Promise<{ status: string; rollbackLog: string[] }> {
        // Compensation transaction
        compensationExecuted = true;
        loadedIssueCount = 0;
        analysisResultGenerated = false;
        patternDetectionResultGenerated = false;
        rollbackLog = [
          "ROLLBACK_COMPENSATION_EXECUTED",
          "REVERTED_ACTION_3_PATTERN_DETECTION",
          "REVERTED_ACTION_2_ANALYSIS_RESULTS",
          "REVERTED_ACTION_1_LOADED_ISSUES",
          "SIDE_EFFECTS_REVERTED",
        ];
        return {
          status: "rolled_back",
          rollbackLog,
        };
      },

      async verifyExternalSystemConsistency(input: {
        originalIssueCount: number;
      }): Promise<{ externalSystemIntact: boolean; currentIssueCount: number }> {
        // Verify external system state unchanged
        return {
          externalSystemIntact: true,
          currentIssueCount: initialIssueCount,
        };
      },
    };

    // Execute agent with injected mock client
    const result = await runTx8Imp1Agent(
      {
        analysisPeriodStartDate: "2024-01-01T00:00:00Z",
        analysisPeriodEndDate: "2024-01-31T23:59:59Z",
        managerEmail: "manager@company.com",
        minimumDataThreshold: 3,
      },
      mockAiClient
    );

    // Verify that side effects were reverted
    expect(compensationExecuted).toBe(true);
    expect(loadedIssueCount).toBe(0);
    expect(analysisResultGenerated).toBe(false);
    expect(patternDetectionResultGenerated).toBe(false);

    // Verify rollback log contains compensation records
    expect(rollbackLog).toContain("ROLLBACK_COMPENSATION_EXECUTED");
    expect(rollbackLog).toContain("SIDE_EFFECTS_REVERTED");

    // Verify orchestrator returned to initial state
    expect(result.analysisStatus).toBe("failed");

    // Verify external system state consistency
    expect(result.externalSystemConsistency).toBe(true);
    expect(result.originalDataIntact).toBe(true);
  });
});