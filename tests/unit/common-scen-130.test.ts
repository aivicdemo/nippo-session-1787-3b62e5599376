import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateMonthlyAnalysisReport } from "../../src/logic/analysis-reporting";
import type {
  Tx7Imp1AiClient,
  MonthlyAnalysisReportInput,
  MonthlyAnalysisReportOutput,
  TeamPerformanceMetric,
} from "../../src/agents/tx-7-imp-1/types";
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-06";

describe("generateMonthlyAnalysisReport", () => {
  let mockAiClient: Tx7Imp1AiClient;
  let auditLog: Array<{
    action: string;
    timestamp: string;
    inputHash: string;
    outputMetrics: TeamPerformanceMetric[];
  }>;

  beforeEach(() => {
    auditLog = [];
    mockAiClient = {
      executeAction06: jest.fn(async (prompt: string) => {
        const inputHash = Buffer.from(prompt).toString("base64").substring(0, 16);
        const mockMetrics: TeamPerformanceMetric[] = [
          {
            teamName: "Team A",
            completionRate: 0.92,
            issueResolutionRate: 0.88,
            responseTimeMinutes: 45,
            previousMonthCompletionRate: 0.85,
            anomalyFlag: false,
            statusJudgment: "normal",
          },
          {
            teamName: "Team B",
            completionRate: 0.78,
            issueResolutionRate: 0.72,
            responseTimeMinutes: 62,
            previousMonthCompletionRate: 0.88,
            anomalyFlag: true,
            statusJudgment: "attention_required",
          },
          {
            teamName: "Team C",
            completionRate: 0.85,
            issueResolutionRate: 0.80,
            responseTimeMinutes: 58,
            previousMonthCompletionRate: 0.84,
            anomalyFlag: false,
            statusJudgment: "normal",
          },
        ];
        auditLog.push({
          action: "action-06",
          timestamp: new Date("2024-01-08T10:00:00Z").toISOString(),
          inputHash,
          outputMetrics: mockMetrics,
        });
        return {
          version: ACTION_06_PROMPT_VERSION,
          metrics: mockMetrics,
        };
      }),
    };
  });

  afterEach(() => {
    auditLog = [];
  });

  // SCEN-130
  test("should execute action-06 for team performance metrics calculation and embed results in monthly analysis report", async () => {
    const reportingDataRecordCount = 248;
    const reportingPeriod = {
      year: 2024,
      month: 1,
    };

    const input: MonthlyAnalysisReportInput = {
      aggregatedReports: [
        {
          reportId: "rep-001",
          reportDate: "2024-01-08",
          teamId: "team-a",
          teamName: "Team A",
          completedTasks: 23,
          reportedIssues: 3,
          resolutionTimeHours: 2.5,
          submittedAt: "2024-01-08T09:15:00Z",
        },
        {
          reportId: "rep-002",
          reportDate: "2024-01-08",
          teamId: "team-b",
          teamName: "Team B",
          completedTasks: 18,
          reportedIssues: 5,
          resolutionTimeHours: 4.1,
          submittedAt: "2024-01-08T08:45:00Z",
        },
        {
          reportId: "rep-003",
          reportDate: "2024-01-08",
          teamId: "team-c",
          teamName: "Team C",
          completedTasks: 21,
          reportedIssues: 4,
          resolutionTimeHours: 3.2,
          submittedAt: "2024-01-08T09:30:00Z",
        },
      ],
      extractedIssues: [
        {
          issueId: "iss-001",
          teamId: "team-a",
          category: "quality",
          priority: "high",
          detectedDate: "2024-01-08",
        },
        {
          issueId: "iss-002",
          teamId: "team-b",
          category: "schedule",
          priority: "critical",
          detectedDate: "2024-01-08",
        },
      ],
      bottleneckTransitions: [
        {
          weekNumber: 1,
          bottleneckType: "resource_constraint",
          affectedTeamIds: ["team-b"],
          severity: "high",
        },
        {
          weekNumber: 2,
          bottleneckType: "process_delay",
          affectedTeamIds: ["team-a", "team-c"],
          severity: "medium",
        },
      ],
      previousMonthMetrics: [
        { teamName: "Team A", completionRate: 0.85, issueResolutionRate: 0.80, responseTimeMinutes: 50 },
        { teamName: "Team B", completionRate: 0.88, issueResolutionRate: 0.82, responseTimeMinutes: 55 },
        { teamName: "Team C", completionRate: 0.84, issueResolutionRate: 0.78, responseTimeMinutes: 60 },
      ],
      reportingDataRecordCount,
      reportingPeriod,
    };

    const output: MonthlyAnalysisReportOutput = await generateMonthlyAnalysisReport(
      input,
      mockAiClient
    );

    expect(mockAiClient.executeAction06).toHaveBeenCalledTimes(1);

    const callArgs = (mockAiClient.executeAction06 as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain("Team A");
    expect(callArgs).toContain("Team B");
    expect(callArgs).toContain("Team C");

    expect(output).toBeDefined();
    expect(output.reportVersion).toBe("1.0");
    expect(output.reportPeriod).toEqual({ year: 2024, month: 1 });
    expect(output.reportedDataRecordCount).toBe(248);

    expect(output.teamPerformanceMetrics).toHaveLength(3);

    const teamAMetric = output.teamPerformanceMetrics.find((m) => m.teamName === "Team A");
    expect(teamAMetric).toBeDefined();
    expect(teamAMetric!.completionRate).toBe(0.92);
    expect(teamAMetric!.issueResolutionRate).toBe(0.88);
    expect(teamAMetric!.responseTimeMinutes).toBe(45);
    expect(teamAMetric!.previousMonthCompletionRate).toBe(0.85);
    expect(teamAMetric!.anomalyFlag).toBe(false);
    expect(teamAMetric!.statusJudgment).toBe("normal");

    const teamBMetric = output.teamPerformanceMetrics.find((m) => m.teamName === "Team B");
    expect(teamBMetric).toBeDefined();
    expect(teamBMetric!.completionRate).toBe(0.78);
    expect(teamBMetric!.issueResolutionRate).toBe(0.72);
    expect(teamBMetric!.responseTimeMinutes).toBe(62);
    expect(teamBMetric!.previousMonthCompletionRate).toBe(0.88);
    expect(teamBMetric!.anomalyFlag).toBe(true);
    expect(teamBMetric!.statusJudgment).toBe("attention_required");

    const teamCMetric = output.teamPerformanceMetrics.find((m) => m.teamName === "Team C");
    expect(teamCMetric).toBeDefined();
    expect(teamCMetric!.completionRate).toBe(0.85);
    expect(teamCMetric!.issueResolutionRate).toBe(0.80);
    expect(teamCMetric!.responseTimeMinutes).toBe(58);
    expect(teamCMetric!.statusJudgment).toBe("normal");

    expect(auditLog).toHaveLength(1);
    const logEntry = auditLog[0];
    expect(logEntry.action).toBe("action-06");
    expect(logEntry.timestamp).toBe("2024-01-08T10:00:00Z");
    expect(logEntry.inputHash).toBeTruthy();
    expect(logEntry.inputHash.length).toBe(16);
    expect(logEntry.outputMetrics).toHaveLength(3);
    expect(logEntry.outputMetrics[0].teamName).toBe("Team A");
    expect(logEntry.outputMetrics[1].teamName).toBe("Team B");
    expect(logEntry.outputMetrics[2].teamName).toBe("Team C");

    const teamBVariationRate =
      ((teamBMetric!.completionRate - teamBMetric!.previousMonthCompletionRate) /
        teamBMetric!.previousMonthCompletionRate) *
      100;
    expect(Math.abs(teamBVariationRate)).toBeGreaterThanOrEqual(10);
    expect(teamBMetric!.anomalyFlag).toBe(true);

    expect(output.analysisMetadata).toBeDefined();
    expect(output.analysisMetadata.action06ExecutedAt).toBe("2024-01-08T10:00:00Z");
    expect(output.analysisMetadata.promptVersion).toBe(ACTION_06_PROMPT_VERSION);
    expect(output.analysisMetadata.calculationBasis).toContain("team_assignment_validation");
  });
});