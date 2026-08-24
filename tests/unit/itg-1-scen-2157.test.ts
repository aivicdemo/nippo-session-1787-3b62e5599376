import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  // SCEN-2157
  test("[error] 課題優先度スコア算出機能 - 課題キーワード抽出結果が空配列のとき、エラーが発生する", () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: "issue_001",
      issueContent: "システム障害が発生している",
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T10:30:00Z",
      teamId: "team_001",
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisService)
    ).toThrow(/抽出されたキーワード/);
  });
});