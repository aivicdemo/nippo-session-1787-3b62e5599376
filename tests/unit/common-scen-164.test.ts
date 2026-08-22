import { runTx9Imp1Agent } from "../../src/agents/tx-9-imp-1/orchestrator";
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from "../../src/agents/tx-9-imp-1/prompts/action-05";

describe("Tx9Imp1Agent - RecurrencePatternDetection", () => {
  test("SCEN-164: Action 5 detects recurrence patterns for same-issue-multiple-occurrences", async () => {
    // Arrange: Prepare mock AI client
    const mockAiClient = {
      async callModel(prompt: string): Promise<string> {
        // Simulate AI response for recurrence pattern detection
        return JSON.stringify({
          recurrencePatterns: [
            {
              issueTitle: "API応答遅延",
              detectionDates: ["2024-01-10", "2024-01-17", "2024-01-24"],
              frequency: "weekly",
              rootCauseHypothesis: "キャッシュリセット周期と連動",
              riskLevel: "high",
            },
          ],
          confidenceScore: 0.92,
        });
      },
    };

    // Prepare aggregated daily report data with recurrence pattern
    const aggregationStartDate = "2024-01-10";
    const aggregationEndDate = "2024-01-31";
    const targetTeamIds: string[] = [];
    const requestedByUserId = "user-dept-head-001";

    // Input request matching Tx9AggregationRequest
    const input = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
    };

    // Mock data: Daily reports with same issue appearing on 3 dates
    const mockDailyReports = [
      {
        reportId: "report-20240110-001",
        submittedDate: "2024-01-10",
        reportContent: "API応答遅延が発生。処理時間が2倍に。",
        extractedIssues: [
          { title: "API応答遅延", severity: "high", reportDate: "2024-01-10" },
        ],
      },
      {
        reportId: "report-20240117-001",
        submittedDate: "2024-01-17",
        reportContent: "再度API応答遅延が発生。同じ時間帯に集中。",
        extractedIssues: [
          { title: "API応答遅延", severity: "high", reportDate: "2024-01-17" },
        ],
      },
      {
        reportId: "report-20240124-001",
        submittedDate: "2024-01-24",
        reportContent: "3度目のAPI応答遅延。パターンが明確。",
        extractedIssues: [
          { title: "API応答遅延", severity: "high", reportDate: "2024-01-24" },
        ],
      },
    ];

    // Mock context after Actions 1-4 complete
    const contextAfterAction4 = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
      aggregatedReports: mockDailyReports,
      extractedIssues: mockDailyReports.flatMap((r) => r.extractedIssues),
      classifiedIssues: [
        {
          title: "API応答遅延",
          category: "performance",
          occurrences: [
            { date: "2024-01-10" },
            { date: "2024-01-17" },
            { date: "2024-01-24" },
          ],
        },
      ],
      priorityAssignments: [
        {
          issueTitle: "API応答遅延",
          priorityScore: 8.5,
          rank: 1,
        },
      ],
      recurrencePatterns: [] as Array<{
        issueTitle: string;
        detectionDates: string[];
        frequency: string;
        rootCauseHypothesis: string;
        riskLevel: string;
        confidenceScore: number;
      }>,
      auditLog: [
        {
          actionId: "action-01",
          timestamp: "2024-02-01T08:00:00Z",
          status: "completed",
        },
        {
          actionId: "action-02",
          timestamp: "2024-02-01T08:05:00Z",
          status: "completed",
        },
        {
          actionId: "action-03",
          timestamp: "2024-02-01T08:10:00Z",
          status: "completed",
        },
        {
          actionId: "action-04",
          timestamp: "2024-02-01T08:15:00Z",
          status: "completed",
        },
      ],
    };

    // Act: Run Tx9Imp1Agent with mock AI client
    const result = await runTx9Imp1Agent(input, mockAiClient);

    // Assert: Verify Action 5 execution and recurrence pattern detection

    // 1. Verify prompt building
    const expectedPromptVersion = ACTION_05_PROMPT_VERSION;
    expect(expectedPromptVersion).toBeDefined();

    const action05Prompt = buildAction05Prompt(contextAfterAction4.classifiedIssues);
    expect(action05Prompt).toContain("API応答遅延");
    expect(action05Prompt).toContain("recurrence");

    // 2. Verify recurrence pattern structure
    expect(result.recurrencePatterns).toBeDefined();
    expect(result.recurrencePatterns.length).toBe(1);

    const detectedPattern = result.recurrencePatterns[0];
    expect(detectedPattern.issueTitle).toBe("API応答遅延");
    expect(Array.isArray(detectedPattern.detectionDates)).toBe(true);
    expect(detectedPattern.detectionDates).toEqual([
      "2024-01-10",
      "2024-01-17",
      "2024-01-24",
    ]);

    // 3. Verify date format (ISO 8601)
    detectedPattern.detectionDates.forEach((dateStr: string) => {
      const dateObj = new Date(dateStr + "T00:00:00Z");
      expect(dateObj.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    // 4. Verify frequency detection
    expect(["daily", "weekly", "monthly"]).toContain(detectedPattern.frequency);
    expect(detectedPattern.frequency).toBe("weekly");

    // 5. Verify root cause hypothesis
    expect(typeof detectedPattern.rootCauseHypothesis).toBe("string");
    expect(detectedPattern.rootCauseHypothesis.length).toBeGreaterThan(0);
    expect(detectedPattern.rootCauseHypothesis).toBe("キャッシュリセット周期と連動");

    // 6. Verify risk level
    expect(["low", "medium", "high"]).toContain(detectedPattern.riskLevel);
    expect(detectedPattern.riskLevel).toBe("high");

    // 7. Verify confidence score
    expect(typeof detectedPattern.confidenceScore).toBe("number");
    expect(detectedPattern.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(detectedPattern.confidenceScore).toBeLessThanOrEqual(1);
    expect(detectedPattern.confidenceScore).toBe(0.92);

    // 8. Verify audit log recording
    const action05AuditEntry = result.auditLog.find(
      (entry: { actionId: string }) => entry.actionId === "action-05"
    );
    expect(action05AuditEntry).toBeDefined();
    expect(action05AuditEntry.status).toBe("completed");
    expect(action05AuditEntry.timestamp).toBeDefined();
    expect(typeof action05AuditEntry.detectedPatternCount).toBe("number");
    expect(action05AuditEntry.detectedPatternCount).toBe(1);
    expect(action05AuditEntry.inputDataHash).toBeDefined();

    // 9. Verify pattern data flows to Action 6
    expect(result.proposedCountermeasures).toBeDefined();
    expect(Array.isArray(result.proposedCountermeasures)).toBe(true);

    // 10. Verify human review requirement noted in audit
    const action05Log = result.auditLog.find(
      (entry: { actionId: string }) => entry.actionId === "action-05"
    );
    expect(action05Log?.humanReviewRequired).toBe(true);
    expect(action05Log?.reviewReason).toContain("初期段階");

    // 11. Verify final analysis report contains recurrence info
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe("string");
    expect(result.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toBe(aggregationEndDate);
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBeGreaterThan(0);

    // 12. Verify productivity metrics included
    expect(result.productivityMetrics).toBeDefined();
    expect(typeof result.productivityMetrics.issueResolutionSpeed).toBe(
      "number"
    );
    expect(typeof result.productivityMetrics.reportSubmissionRate).toBe("number");
    expect(typeof result.productivityMetrics.issueRecurrenceRate).toBe("number");

    // 13. Verify recurrence rate reflects detected pattern
    expect(result.productivityMetrics.issueRecurrenceRate).toBeGreaterThan(0);

    // 14. Verify generated timestamp
    expect(result.generatedAt).toBeDefined();
    const generatedDate = new Date(result.generatedAt);
    expect(generatedDate.getTime()).toBeGreaterThan(0);
  });
});