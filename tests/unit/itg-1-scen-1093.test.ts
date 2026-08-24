import { describe, test, expect, beforeEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type { IssuePriorityScoringInput } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction Prioritization - Impact Score Normalization", () => {
  // SCEN-1093: [edge] 課題影響度判定機能 - チーム波及度スコアが100を超える値で判定される
  test("should normalize impact score when it exceeds maximum threshold of 100", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(105),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "重大な障害が発生しています。システム全体に影響があります。",
      occurrenceFrequency: 5,
      impactScore: 105,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T09:00:00Z",
      teamId: "team-001",
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);

    if (result.priorityScore === 100) {
      expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    }

    expect(result.priorityRank).toMatch(/高|中|低/);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(result.issueId).toBe("issue-001");
    expect(result.calculatedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  });
});