import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定機能", () => {
  // SCEN-1013
  test("抽出された複数の課題キーワードに対して各々のチーム波及度スコア（0-100）が算出される", () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "データベース接続エラー", frequency: 3 },
          { keyword: "本番環境", frequency: 2 },
          { keyword: "顧客対応", frequency: 1 },
        ],
      }),
      assessImpactScore: jest
        .fn()
        .mockImplementation((keyword: string) => {
          const scoreMap: Record<string, number> = {
            データベース接続エラー: 87,
            本番環境: 92,
            顧客対応: 65,
          };
          return Promise.resolve(scoreMap[keyword] || 0);
        }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: "ISSUE-001",
      issueContent:
        "データベース接続エラーが発生している。本番環境で継続中。顧客対応が必要。",
      occurrenceFrequency: 3,
      impactScore: 87,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "TEAM-001",
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.issueId).toBe("ISSUE-001");
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(
      0
    );
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(
      20
    );
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe("string");
  });
});