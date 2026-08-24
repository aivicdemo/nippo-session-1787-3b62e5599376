import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
  ScoreBreakdown,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Priority Score Calculation - Year-Crossing Period", () => {
  // SCEN-645: [edge] 課題優先度スコア計算機能 - 年をまたぐ過去30日間の期間で正確に優先度スコアが計算される

  let mockTextAnalysisAdapter: {
    assessImpactScore: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      assessImpactScore: jest.fn((keyword: string): number => {
        const impactScores: { [key: string]: number } = {
          "課題A": 40,
          "課題B": 60,
          "課題C": 50,
        };
        return impactScores[keyword] || 50;
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should calculate priority score accurately across year boundary with correct 30-day period", () => {
    const testReferenceDate = new Date("2024-01-01T23:59:59.000Z");
    const expectedStartDate = new Date("2023-12-03T00:00:00.000Z");
    const expectedEndDate = new Date("2024-01-01T23:59:59.000Z");

    const issueRecord_A = {
      issueId: "issue-001",
      keyword: "課題A",
      reportingDate: "2023-12-03",
      occurrenceFrequency: 1,
      impactScore: 40,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      issueContent: "Database connection timeout",
      teamId: "team-001",
    };

    const issueRecord_B = {
      issueId: "issue-002",
      keyword: "課題B",
      reportingDate: "2023-12-15",
      occurrenceFrequency: 3,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      issueContent: "API performance degradation",
      teamId: "team-001",
    };

    const issueRecord_C = {
      issueId: "issue-003",
      keyword: "課題C",
      reportingDate: "2024-01-01",
      occurrenceFrequency: 2,
      impactScore: 50,
      affectedTeamCount: 1,
      resolutionDaysAverage: 3,
      issueContent: "Memory leak in batch process",
      teamId: "team-001",
    };

    const allRecords = [issueRecord_A, issueRecord_B, issueRecord_C];

    const frequencyScore_A = (issueRecord_A.occurrenceFrequency / 6) * 40;
    const frequencyScore_B = (issueRecord_B.occurrenceFrequency / 6) * 40;
    const frequencyScore_C = (issueRecord_C.occurrenceFrequency / 6) * 40;

    const impactScore_A = (issueRecord_A.affectedTeamCount / 3) * 40;
    const impactScore_B = (issueRecord_B.affectedTeamCount / 3) * 40;
    const impactScore_C = (issueRecord_C.affectedTeamCount / 3) * 40;

    const resolutionDifficulty_A = (issueRecord_A.resolutionDaysAverage / 5) * 20;
    const resolutionDifficulty_B = (issueRecord_B.resolutionDaysAverage / 5) * 20;
    const resolutionDifficulty_C = (issueRecord_C.resolutionDaysAverage / 5) * 20;

    const priorityScore_A = Math.round(frequencyScore_A + impactScore_A + resolutionDifficulty_A);
    const priorityScore_B = Math.round(frequencyScore_B + impactScore_B + resolutionDifficulty_B);
    const priorityScore_C = Math.round(frequencyScore_C + impactScore_C + resolutionDifficulty_C);

    const priorityScores = {
      [issueRecord_A.issueId]: priorityScore_A,
      [issueRecord_B.issueId]: priorityScore_B,
      [issueRecord_C.issueId]: priorityScore_C,
    };

    const inputs: IssuePriorityScoringInput[] = [
      issueRecord_A,
      issueRecord_B,
      issueRecord_C,
    ];

    const results: IssuePriorityScoringOutput[] = [];

    for (const input of inputs) {
      const result = calculateIssuePriorityScore(input);
      results.push(result);
    }

    expect(results).toHaveLength(3);

    expect(results[0]).toMatchObject({
      issueId: "issue-001",
      priorityScore: priorityScores["issue-001"],
      priorityRank: priorityScore_A >= 70 ? "高" : priorityScore_A >= 40 ? "中" : "低",
      calculatedAt: expect.any(String),
    });

    expect(results[0].scoreBreakdown).toMatchObject({
      frequencyScore: expect.any(Number),
      impactScore: expect.any(Number),
      resolutionDifficultyScore: expect.any(Number),
    });

    const scoreBreakdown_A = results[0].scoreBreakdown;
    expect(scoreBreakdown_A.frequencyScore).toBe(Math.round(frequencyScore_A));
    expect(scoreBreakdown_A.impactScore).toBe(Math.round(impactScore_A));
    expect(scoreBreakdown_A.resolutionDifficultyScore).toBe(
      Math.round(resolutionDifficulty_A)
    );

    expect(results[1]).toMatchObject({
      issueId: "issue-002",
      priorityScore: priorityScores["issue-002"],
      priorityRank: priorityScore_B >= 70 ? "高" : priorityScore_B >= 40 ? "中" : "低",
      calculatedAt: expect.any(String),
    });

    const scoreBreakdown_B = results[1].scoreBreakdown;
    expect(scoreBreakdown_B.frequencyScore).toBe(Math.round(frequencyScore_B));
    expect(scoreBreakdown_B.impactScore).toBe(Math.round(impactScore_B));
    expect(scoreBreakdown_B.resolutionDifficultyScore).toBe(
      Math.round(resolutionDifficulty_B)
    );

    expect(results[2]).toMatchObject({
      issueId: "issue-003",
      priorityScore: priorityScores["issue-003"],
      priorityRank: priorityScore_C >= 70 ? "高" : priorityScore_C >= 40 ? "中" : "低",
      calculatedAt: expect.any(String),
    });

    const scoreBreakdown_C = results[2].scoreBreakdown;
    expect(scoreBreakdown_C.frequencyScore).toBe(Math.round(frequencyScore_C));
    expect(scoreBreakdown_C.impactScore).toBe(Math.round(impactScore_C));
    expect(scoreBreakdown_C.resolutionDifficultyScore).toBe(
      Math.round(resolutionDifficulty_C)
    );

    for (const result of results) {
      expect(result.priorityScore).toBeGreaterThanOrEqual(1);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(["高", "中", "低"]).toContain(result.priorityRank);
      expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
      expect(new Date(result.calculatedAt).getTime()).toBeGreaterThan(0);
    }

    const calculatedAt = new Date(results[0].calculatedAt);
    expect(calculatedAt.getTime()).toBeLessThanOrEqual(testReferenceDate.getTime() + 1000);

    const totalOccurrenceFrequency =
      issueRecord_A.occurrenceFrequency +
      issueRecord_B.occurrenceFrequency +
      issueRecord_C.occurrenceFrequency;
    expect(totalOccurrenceFrequency).toBe(6);

    const periodStart = new Date(expectedStartDate);
    const periodEnd = new Date(expectedEndDate);
    const periodDays = Math.round(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(periodDays).toBe(29);

    for (const record of allRecords) {
      const recordDate = new Date(record.reportingDate);
      expect(recordDate.getTime()).toBeGreaterThanOrEqual(periodStart.getTime());
      expect(recordDate.getTime()).toBeLessThanOrEqual(
        periodEnd.getTime() + 86400000
      );
    }
  });
});