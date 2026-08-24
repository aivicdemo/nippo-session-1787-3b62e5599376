import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算機能', () => {
  // SCEN-646: [edge] 課題優先度スコア計算機能 - 同一の課題が複数回抽出されている場合に発生頻度に基づいて優先度スコアが計算される
  test('同一キーワードが複数回抽出される場合、統合された発生頻度に基づいて優先度スコアが計算される', () => {
    // Arrange: 同一キーワード「顧客対応」が複数回抽出されたシナリオを準備
    // frequency: 3 + 1 = 4（統合後）、DB接続エラー: 2
    const input_with_high_frequency_issue: IssuePriorityScoringInput = {
      issueId: 'issue_001',
      issueContent: '顧客対応時に頻繁に問題が発生している',
      occurrenceFrequency: 4, // 3 + 1 の統合結果
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team_dev_001'
    };

    const input_with_low_frequency_issue: IssuePriorityScoringInput = {
      issueId: 'issue_002',
      issueContent: 'DB接続エラーが発生している',
      occurrenceFrequency: 2,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team_dev_001'
    };

    // Act: 優先度スコア計算を実行
    const result_high_frequency: IssuePriorityScoringOutput = calculateIssuePriorityScore(input_with_high_frequency_issue);
    const result_low_frequency: IssuePriorityScoringOutput = calculateIssuePriorityScore(input_with_low_frequency_issue);

    // Assert: 同一キーワードが統合された「顧客対応」（frequency: 4）のスコアが、
    // DB接続エラー（frequency: 2）のスコアより高く計算されていることを検証
    expect(result_high_frequency.priorityScore).toBeGreaterThan(result_low_frequency.priorityScore);

    // 具体的なスコア値を検証
    // 発生頻度スコア: frequency / max * 40 = 4 / 10 * 40 = 16 (顧客対応)
    // vs 2 / 10 * 40 = 8 (DB接続エラー)
    // 影響度スコア: impactScore * 0.4 = 85 * 0.4 = 34 (顧客対応)
    // vs 60 * 0.4 = 24 (DB接続エラー)
    // 解決難度スコア: (resolutionDaysAverage / 10) * 20 = (2 / 10) * 20 = 4 (顧客対応)
    // vs (1 / 10) * 20 = 2 (DB接続エラー)
    // 合計: 16 + 34 + 4 = 54 (顧客対応)
    // vs 8 + 24 + 2 = 34 (DB接続エラー)
    expect(result_high_frequency.priorityScore).toBe(54);
    expect(result_low_frequency.priorityScore).toBe(34);

    // 優先度ランクが正しく判定されていることを検証
    expect(result_high_frequency.priorityRank).toBe('高');
    expect(result_low_frequency.priorityRank).toBe('中');

    // スコア内訳の検証
    expect(result_high_frequency.scoreBreakdown.frequencyScore).toBe(16);
    expect(result_high_frequency.scoreBreakdown.impactScore).toBe(34);
    expect(result_high_frequency.scoreBreakdown.resolutionDifficultyScore).toBe(4);

    expect(result_low_frequency.scoreBreakdown.frequencyScore).toBe(8);
    expect(result_low_frequency.scoreBreakdown.impactScore).toBe(24);
    expect(result_low_frequency.scoreBreakdown.resolutionDifficultyScore).toBe(2);

    // ダッシュボード表示用色コードの検証
    expect(result_high_frequency.colorCode).toBe('#FF0000'); // 赤（優先度高）
    expect(result_low_frequency.colorCode).toBe('#FFFF00'); // 黄（優先度中）

    // 計算実行日時が記録されていることを検証
    expect(result_high_frequency.calculatedAt).toBeDefined();
    expect(result_low_frequency.calculatedAt).toBeDefined();
  });
});