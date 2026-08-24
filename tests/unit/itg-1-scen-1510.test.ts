import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  test("SCEN-1510: 前週の日報から抽出された課題に対して優先度スコアが算出される", () => {
    // Arrange: TextAnalysisServiceAdapterをスタブ化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(65),
      classifyIssueSeverity: jest.fn(),
    };

    // 課題優先度スコア算出の入力データを構築
    // 課題データ: 発生頻度3件、影響度65、対象チーム2チーム、平均解決期間2日
    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "データベース接続タイムアウト問題",
      occurrenceFrequency: 3,
      impactScore: 65,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-14",
      teamId: "team-001",
    };

    // Act: 優先度スコア算出を実行
    const result = calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert: TextAnalysisServiceAdapterのassessImpactScoreが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(
      1
    );

    // スタブが返すチーム波及度スコアが65であることを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        issueContent: "データベース接続タイムアウト問題",
        affectedTeamCount: 2,
      })
    );

    // 算出されたスコアが0～100の範囲内の数値であることを確認
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // スコアがIssuePriorityScoringOutputの形式で返されることを確認
    expect(result).toEqual(
      expect.objectContaining({
        issueId: "issue-001",
        priorityScore: expect.any(Number),
        priorityRank: expect.stringMatching(/^(高|中|低)$/),
        scoreBreakdown: expect.objectContaining({
          frequencyScore: expect.any(Number),
          impactScore: expect.any(Number),
          resolutionDifficultyScore: expect.any(Number),
        }),
        colorCode: expect.stringMatching(/^#[0-9A-F]{6}$/),
        calculatedAt: expect.any(String),
      })
    );

    // スコア内訳の合計が優先度スコアと一致することを確認
    const totalBreakdownScore =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalBreakdownScore).toBe(result.priorityScore);

    // スコア内訳が正しい範囲内であることを確認
    // frequencyScore: 0～40
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    // impactScore: 0～40
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    // resolutionDifficultyScore: 0～20
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 計算日時がISO 8601形式であることを確認
    expect(new Date(result.calculatedAt)).toBeInstanceOf(Date);
    expect(result.calculatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});