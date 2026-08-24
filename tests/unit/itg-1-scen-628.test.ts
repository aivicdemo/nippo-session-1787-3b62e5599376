import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import { type IssuePriorityScoringInput } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア計算機能", () => {
  // SCEN-628
  test("課題キーワードが null または undefined のとき例外を発生させる", () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const baseInput: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "テスト課題",
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    // null の場合
    expect(() => {
      calculateIssuePriorityScore(
        { ...baseInput, issueContent: null as any },
        mockTextAnalysisAdapter
      );
    }).toThrow(/課題キーワード/);

    // undefined の場合
    expect(() => {
      calculateIssuePriorityScore(
        { ...baseInput, issueContent: undefined as any },
        mockTextAnalysisAdapter
      );
    }).toThrow(/課題キーワード/);

    // 外部サービスへの呼び出しが発生していないことを確認
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});