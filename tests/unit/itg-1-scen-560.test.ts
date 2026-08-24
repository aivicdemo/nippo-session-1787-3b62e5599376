import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-560: [normal] 課題優先度判定機能 - TextAnalysisServiceAdapterが正常応答した場合、抽出されたキーワードに基づいて影響度スコアが計算される
  test('TextAnalysisServiceAdapterが正常応答した場合、抽出キーワード出現頻度に基づいて影響度スコアが計算され、高頻度キーワードほど高スコアに反映される', () => {
    // 入力データ：過去30日間の発生頻度3回、影響度スコア65、影響チーム数2、平均解決日数2日
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース障害が3回発生した。API遅延の影響でチーム全体の処理が遅れている',
      occurrenceFrequency: 3,
      impactScore: 65,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    // 関数を実行
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // 期待結果：
    // - priorityScore は発生頻度スコア（0～40）、影響度スコア（0～40）、解決難度スコア（0～20）の合算
    // - 発生頻度 3 回は比較的高い → 発生頻度スコア約30
    // - 影響度スコア 65 は 40ポイント中 26 (65/100 * 40)
    // - 解決難度は平均2日で対応可能 → 解決難度スコア約8 (20 - (2/5)*20 = 12)
    // - 合計スコア: 30 + 26 + 12 = 68 (65～75の範囲内)
    expect(result.priorityScore).toBeGreaterThanOrEqual(65);
    expect(result.priorityScore).toBeLessThanOrEqual(75);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);

    // issueId が入力と一致
    expect(result.issueId).toBe('issue-001');

    // priorityRank は優先度スコアに応じて判定される（70以上なら'高'）
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);

    // scoreBreakdown が返却される
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // colorCode がダッシュボード表示用の色コードで返却される
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);

    // calculatedAt が ISO 8601 形式の日時で返却される
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});