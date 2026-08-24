import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type { IssuePriorityScoringInput } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア計算", () => {
  // SCEN-3002: TextAnalysisServiceAdapter の assessImpactScore 呼び出し失敗時、エラーが正確に伝播される
  test("assessImpactScore API 呼び出し失敗時、エラーがスタック情報を保持したまま伝播される", async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを作成
    const failingTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockRejectedValueOnce(
        new Error("API connection timeout")
      ),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "データベース接続エラーが頻発している",
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    // Act & Assert: assessImpactScore 呼び出し失敗時、エラーが伝播される
    await expect(
      calculateIssuePriorityScore(input, failingTextAnalysisAdapter)
    ).rejects.toThrow(/API connection timeout/);

    // Assert: assessImpactScore が実際に呼び出されたことを確認
    expect(
      failingTextAnalysisAdapter.assessImpactScore
    ).toHaveBeenCalledTimes(1);
    expect(failingTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        issueContent: "データベース接続エラーが頻発している",
        affectedTeamCount: 3,
      })
    );
  });
});