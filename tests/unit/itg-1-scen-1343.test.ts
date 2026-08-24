import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付けの機能', () => {
  // SCEN-1343: [edge] 課題影響度判定機能 - 課題の影響度スコアがちょうど高優先度の閾値（例：70点）で高優先度に判定される
  test('影響度スコアがちょうど高優先度の閾値70点の場合、高優先度に判定される', () => {
    // Arrange: 課題データを準備
    const issueId = 'issue-001';
    const issueContent = 'データベース接続タイムアウト';
    const occurrenceFrequency = 5;
    const impactScore = 70;
    const affectedTeamCount = 3;
    const resolutionDaysAverage = 2.5;
    const reportingDate = '2024-01-15';
    const teamId = 'team-dev-001';

    // Act: 優先度スコア計算処理を実行
    const result = calculateIssuePriorityScore({
      issueId,
      issueContent,
      occurrenceFrequency,
      impactScore,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    });

    // Assert: 結果が高優先度に分類されることを確認
    expect(result.issueId).toBe(issueId);
    expect(result.priorityRank).toBe('高');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.colorCode).toBe('#FF0000');

    // Assert: scoreBreakdown が正しく計算されていることを確認
    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');

    // frequencyScore: 過去30日間の発生頻度が5件 → スコア計算（最大40点）
    // 最大仮定値を30件とした場合: (5 / 30) * 40 ≈ 6.67点
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    // impactScore: 入力された影響度スコア70 → scoreBreakdown.impactScore（最大40点に正規化）
    // 正規化: (70 / 100) * 40 = 28点
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);

    // resolutionDifficultyScore: 平均解決日数2.5日 → スコア計算（最大20点）
    // 解決難度スコア: (2.5 / 10) * 20 = 5点（仮定：最大解決日数は10日）
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Assert: calculatedAt が ISO 8601形式で記録されていることを確認
    expect(typeof result.calculatedAt).toBe('string');
    expect(new Date(result.calculatedAt).toString()).not.toBe('Invalid Date');
  });
});