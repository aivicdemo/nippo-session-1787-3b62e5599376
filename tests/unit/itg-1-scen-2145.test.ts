import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け', () => {
  // SCEN-2145: [normal] 課題優先度スコア算出機能 - 同一課題キーワードが複数件の場合、発生頻度と影響度を組み合わせた優先度スコアで降順ソートされる
  test('同一課題キーワードが複数件報告された場合、優先度スコア（発生頻度×影響度）の降順でソートされる', () => {
    // テストデータ: 同一の課題キーワード『データベース接続エラー』を含む3件の入力
    // 日報1: 出現頻度1回、影響度スコア30点 → 優先度スコア = 1 × 30 = 30
    // 日報2: 出現頻度3回、影響度スコア70点 → 優先度スコア = 3 × 70 = 210
    // 日報3: 出現頻度2回、影響度スコア50点 → 優先度スコア = 2 × 50 = 100
    
    const issueInput1: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生しました',
      occurrenceFrequency: 1,
      impactScore: 30,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const issueInput2: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'データベース接続エラーで本番環境が停止',
      occurrenceFrequency: 3,
      impactScore: 70,
      affectedTeamCount: 3,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const issueInput3: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'データベース接続エラーでリポート作成に遅延',
      occurrenceFrequency: 2,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // 優先度スコア算出を実行
    const result1: IssuePriorityScoringOutput = calculateIssuePriorityScore(issueInput1);
    const result2: IssuePriorityScoringOutput = calculateIssuePriorityScore(issueInput2);
    const result3: IssuePriorityScoringOutput = calculateIssuePriorityScore(issueInput3);

    // 期待値: 計算式に基づく優先度スコア
    // result1: 1 × 30 = 30
    // result2: 3 × 70 = 210
    // result3: 2 × 50 = 100

    expect(result1.priorityScore).toBe(30);
    expect(result2.priorityScore).toBe(210);
    expect(result3.priorityScore).toBe(100);

    // ソート確認: 優先度スコアの降順（高い順）
    const results = [result1, result2, result3];
    const sortedResults = results.sort((a, b) => b.priorityScore - a.priorityScore);

    // 期待結果: [210, 100, 30] の順序
    expect(sortedResults[0].priorityScore).toBe(210);
    expect(sortedResults[0].priorityRank).toBe('高');
    expect(sortedResults[0].colorCode).toBe('#FF0000');

    expect(sortedResults[1].priorityScore).toBe(100);
    expect(sortedResults[1].priorityRank).toBe('中');
    expect(sortedResults[1].colorCode).toBe('#FFFF00');

    expect(sortedResults[2].priorityScore).toBe(30);
    expect(sortedResults[2].priorityRank).toBe('低');
    expect(sortedResults[2].colorCode).toBe('#00FF00');

    // スコア内訳の検証
    expect(result2.scoreBreakdown.frequencyScore).toBe(40); // 発生頻度スコア上限
    expect(result2.scoreBreakdown.impactScore).toBe(40);   // 影響度スコア上限
    expect(result2.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result2.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 計算実行日時が記録されていることを確認
    expect(result1.calculatedAt).toBeDefined();
    expect(new Date(result1.calculatedAt)).toBeInstanceOf(Date);
    expect(result2.calculatedAt).toBeDefined();
    expect(result3.calculatedAt).toBeDefined();
  });
});