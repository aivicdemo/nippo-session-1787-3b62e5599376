import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1538
  test('発生頻度が優先度判定閾値未満（例：週4回）で低ランクに分類される', () => {
    // 発生頻度が週3回（閾値週4回未満）のシナリオ
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 3, // 過去30日間の発生頻度が3回
      impactScore: 35, // チーム波及度35（0-100スケール）
      affectedTeamCount: 1,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    // スコア計算の内訳を確認
    // 発生頻度スコア: 3回 → (3/30)*40 = 4.0点（0-40ポイント）
    // 影響度スコア: 35 → (35/100)*40 = 14.0点（0-40ポイント）
    // 解決難度スコア: 平均解決日数2.5日 → (2.5/30)*20 = 1.67点（0-20ポイント）
    // 総優先度スコア: 4.0 + 14.0 + 1.67 ≈ 19.67 → 約20点（1-100スケール）

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeLessThan(40); // 低優先度スコア
    expect(result.priorityRank).toBe('低'); // 低ランク分類
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe('#00FF00'); // 緑色（低優先度）
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});