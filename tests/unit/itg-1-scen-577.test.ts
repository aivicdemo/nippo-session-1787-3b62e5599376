import { describe, test, expect, beforeEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

// Mock TextAnalysisServiceAdapter
interface MockTextAnalysisServiceAdapter {
  extractKeywords: jest.Mock;
  assessImpactScore: jest.Mock;
  classifyIssueSeverity: jest.Mock;
}

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  let mockTextAnalysisServiceAdapter: MockTextAnalysisServiceAdapter;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-577
  test("チーム波及度スコアがundefinedのとき影響度スコア計算エラーが発生する", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "システム障害が発生しており、対応が必要です",
      occurrenceFrequency: 5,
      impactScore: undefined as any,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T09:00:00Z",
      teamId: "team-A",
    };

    mockTextAnalysisServiceAdapter.assessImpactScore.mockReturnValue(
      undefined
    );

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/影響度スコア|波及度|計算エラー/);
  });
});