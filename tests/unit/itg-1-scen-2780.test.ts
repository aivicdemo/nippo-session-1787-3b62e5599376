import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度と優先度スコア計算', () => {
  // SCEN-2780: [edge] 課題優先度スコア計算・色分け表示機能 - 優先度スコアが100の課題が高優先度色で表示される
  test('優先度スコア100の課題が高優先度色で表示される', () => {
    // テスト用入力データ: 最大値のスコアを生成する条件
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 30, // 過去30日間の最大発生頻度
      impactScore: 100, // チーム波及度スコアの最大値
      affectedTeamCount: 5, // 複数チームに影響
      resolutionDaysAverage: 1, // 解決が極めて困難（解決期間が長い）
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001'
    };

    // 対象関数を呼び出す
    const result = calculateIssuePriorityScore(input);

    // 期待結果: 優先度スコアが100を返す（最大値）
    expect(result.priorityScore).toBe(100);

    // 優先度ランクが「高」であることを検証
    expect(result.priorityRank).toBe('高');

    // 色コードが高優先度色の赤色（#FF0000）であることを検証
    expect(result.colorCode).toBe('#FF0000');

    // スコア内訳の検証
    // 発生頻度スコア: 30件/30日 = 1.0倍 → 40点満点で最大値
    expect(result.scoreBreakdown.frequencyScore).toBe(40);

    // 影響度スコア: 100/100 = 1.0倍 → 40点満点で最大値
    expect(result.scoreBreakdown.impactScore).toBe(40);

    // 解決難度スコア: 平均解決日数が長いほど難度が高い → 最大20点
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(20);

    // スコア合計が正確に100であることを検証
    const totalScore =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalScore).toBe(100);

    // 計算実行日時がISO 8601形式で記録されていることを検証
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});