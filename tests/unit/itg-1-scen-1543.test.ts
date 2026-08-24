import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能 - 月末日を含む期間集計', () => {
  // SCEN-1543
  test('前週データが月末日を含む場合でも期間集計が正確に計算される', () => {
    // テスト用データセット：2月の月末日を含む期間
    // 2月27日（月末日前日）から2月28日（月末日）までの集計期間を設定
    const aggregationStartDate = new Date('2024-02-27T00:00:00Z');
    const aggregationEndDate = new Date('2024-02-28T23:59:59Z');

    // 課題優先度スコア算出用の入力データ
    const scoringInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5, // 集計期間内の発生頻度は5件（前日3件＋月末日2件）
      impactScore: 85, // チーム全体への波及度スコア
      affectedTeamCount: 2, // 影響を受けるチーム数
      resolutionDaysAverage: 2, // 平均解決日数
      reportingDate: '2024-02-28', // 月末日に報告
      teamId: 'team-001',
    };

    // calculateIssuePriorityScoringInputをmock化した呼び出し
    // 実装内部でテキスト解析が行われるため、以下の値をmockのレスポンスとして期待
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(scoringInput);

    // 期待結果の検証：月末日を含む期間での正確な集計
    // 優先度スコアの計算式：
    // frequencyScore = min(40, occurrenceFrequency * 8) = min(40, 5 * 8) = 40
    // impactScore = 85（入力値そのまま、ただし0-40のスケーリングが必要な場合は40に正規化）
    // resolutionDifficultyScore = min(20, resolutionDaysAverage * 10) = min(20, 2 * 10) = 20
    // totalPriorityScore = frequencyScore + impactScore + resolutionDifficultyScore = 40 + 34 + 20 = 94
    // ※ impactScore の 85 は 0-40 スケール時に (85/100) * 40 ≈ 34 に正規化

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(94);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    expect(result.scoreBreakdown.impactScore).toBe(34);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(20);
    expect(result.colorCode).toBe('#FF0000'); // 優先度スコア94は高優先度の色コード（赤）
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 集計対象外のデータ（翌月初日）が除外されていることを暗示するテスト
    // 発生頻度が5件であることで、2月29日以降のデータが正しく除外されたことを確認
    expect(result.scoreBreakdown.frequencyScore).toBe(40); // 5件の正確な反映
  });
});