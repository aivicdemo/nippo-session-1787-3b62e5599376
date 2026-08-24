import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";
import type { Tx11Imp1AiClient } from "../../src/agents/tx-11-imp-1/orchestrator";
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from "../../src/agents/tx-11-imp-1/prompts/action-03";

describe("Tx11Imp1Agent - Issue Extraction from Submitted Reports", () => {
  // SCEN-3236
  test("should extract issue keywords from submitted daily reports with severity classification", async () => {
    const executionTimestamp = new Date("2024-01-15T08:30:00Z");
    const teamId = "team-001";
    const reportDeadlineTime = "09:00";
    const morningMeetingStartTime = "09:30";

    const mockSubmittedReports = [
      {
        id: "report-001",
        userId: "user-001",
        teamId: teamId,
        reportDate: "2024-01-15",
        yesterdayAccomplished: "Fixed authentication module",
        todayPlanned: "Deploy to staging",
        challengesFaced: "System障害 が発生し、ユーザー認証エラー により一部ユーザーがアクセスできない状態が続いている。API レスポンス遅延 も同時に観測されている。",
        submittedAt: new Date("2024-01-15T08:45:00Z"),
      },
      {
        id: "report-002",
        userId: "user-002",
        teamId: teamId,
        reportDate: "2024-01-15",
        yesterdayAccomplished: "Completed database migration",
        todayPlanned: "Run performance tests",
        challengesFaced: "Database接続タイムアウト と API レスポンス遅延 が観測されている。",
        submittedAt: new Date("2024-01-15T08:50:00Z"),
      },
      {
        id: "report-003",
        userId: "user-003",
        teamId: teamId,
        reportDate: "2024-01-15",
        yesterdayAccomplished: "Reviewed pull requests",
        todayPlanned: "Merge feature branches",
        challengesFaced: "System障害 の影響でテスト環境が利用できず、進捗が阻害されている。",
        submittedAt: new Date("2024-01-15T08:55:00Z"),
      },
    ];

    const mockExtractedKeywords = [
      { keyword: "System障害", frequency: 2, confidence: 0.95 },
      { keyword: "ユーザー認証エラー", frequency: 1, confidence: 0.92 },
      { keyword: "API レスポンス遅延", frequency: 2, confidence: 0.88 },
      { keyword: "Database接続タイムアウト", frequency: 1, confidence: 0.85 },
    ];

    const mockSeverityMap: Record<string, string> = {
      "System障害": "high",
      "ユーザー認証エラー": "high",
      "API レスポンス遅延": "medium",
      "Database接続タイムアウト": "medium",
    };

    const mockAiClient: Tx11Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue(mockExtractedKeywords),
      classifyIssueSeverity: jest.fn().mockImplementation(async (keyword: string) => {
        return mockSeverityMap[keyword] || "low";
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
    };

    const result = await runTx11Imp1Agent(
      {
        executionTimestamp,
        teamId,
        reportDeadlineTime,
        morningMeetingStartTime,
      },
      mockAiClient
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty("extractedIssues");
    expect(result).toHaveProperty("issueKeywords");
    expect(result).toHaveProperty("issueSeverities");

    const extractedIssuesArray = Array.isArray(result.extractedIssues)
      ? result.extractedIssues
      : Object.values(result.extractedIssues || {});

    expect(extractedIssuesArray.length).toBeGreaterThanOrEqual(3);

    const issueStrings = extractedIssuesArray.map((issue: any) =>
      typeof issue === "string" ? issue : issue.keyword || issue.name || String(issue)
    );

    expect(issueStrings).toContain("System障害");
    expect(issueStrings).toContain("ユーザー認証エラー");
    expect(issueStrings).toContain("API レスポンス遅延");

    const severitiesRecord = result.issueSeverities;
    expect(severitiesRecord).toBeDefined();
    expect(typeof severitiesRecord).toBe("object");

    expect(severitiesRecord["System障害"]).toBe("high");
    expect(severitiesRecord["ユーザー認証エラー"]).toBe("high");
    expect(severitiesRecord["API レスポンス遅延"]).toBe("medium");
    expect(severitiesRecord["Database接続タイムアウト"]).toBe("medium");

    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.classifyIssueSeverity).toHaveBeenCalledWith("System障害");
    expect(mockAiClient.classifyIssueSeverity).toHaveBeenCalledWith("ユーザー認証エラー");
    expect(mockAiClient.classifyIssueSeverity).toHaveBeenCalledWith("API レスポンス遅延");

    const sortedIssues = extractedIssuesArray.sort((a: any, b: any) => {
      const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const aKey = typeof a === "string" ? a : a.keyword || a.name;
      const bKey = typeof b === "string" ? b : b.keyword || b.name;
      const aSeverity = severitiesRecord[aKey] || "low";
      const bSeverity = severitiesRecord[bKey] || "low";
      return (severityOrder[aSeverity] || 3) - (severityOrder[bSeverity] || 3);
    });

    expect(sortedIssues[0]).toMatch(/System障害|ユーザー認証エラー/);
    expect(sortedIssues[sortedIssues.length - 1]).toMatch(/Database接続タイムアウト/);

    const prompt03 = buildAction03Prompt({
      reportedIssues: mockExtractedKeywords,
      submittedReportsCount: mockSubmittedReports.length,
    });

    expect(prompt03).toBeDefined();
    expect(typeof prompt03).toBe("string");
    expect(prompt03.length).toBeGreaterThan(0);

    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe("string");
  });
});