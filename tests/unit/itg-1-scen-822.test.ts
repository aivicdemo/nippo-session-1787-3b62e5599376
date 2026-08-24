import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  test('SCEN-822: 発生頻度の合計が999件のときオーバーフロー無く正確に計算される', () => {
    // 入力準備: 発生頻度合計999件のケース
    // キーワードA: 450件, キーワードB: 300件, キーワードC: 249件
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours affecting multiple services',
      occurrenceFrequency: 999,
      impactScore: 85,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 計算実行
    const result = calculateIssuePriorityScore(input);

    // 期待結果の検証

    // 1. 戻り値の型チェック
    expect(result).toHaveProperty('issueId');
    expect(result).toHaveProperty('priorityScore');
    expect(result).toHaveProperty('priorityRank');
    expect(result).toHaveProperty('scoreBreakdown');
    expect(result).toHaveProperty('colorCode');
    expect(result).toHaveProperty('calculatedAt');

    // 2. issueId が入力値と一致
    expect(result.issueId).toBe('issue-001');

    // 3. priorityScore は0～100の範囲内の整数
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.priorityScore)).toBe(true);

    // 4. 発生頻度が999（最大規模）の場合の具体的な優先度スコア計算検証
    // frequencyScore = Math.min((999 / 1000) * 40, 40) = 39.96 ≈ 40
    // impactScore = 85 (入力値の影響度スコアは0～100のため、そのまま40段階に正規化)
    // resolutionDifficultyScore = Math.min((1 / 2) * 20, 20) = 10
    // 期待される優先度スコア = 40 + 34 + 10 = 84
    const expectedFrequencyScore = Math.min((999 / 1000) * 40, 40);
    const expectedImpactScore = Math.min((85 / 100) * 40, 40);
    const expectedResolutionDifficultyScore = Math.min((1 / 2) * 20, 20);
    const expectedPriorityScore = Math.round(
      expectedFrequencyScore + expectedImpactScore + expectedResolutionDifficultyScore
    );

    expect(result.priorityScore).toBe(expectedPriorityScore);

    // 5. scoreBreakdown の各要素が正確に計算されている
    expect(result.scoreBreakdown.frequencyScore).toBeCloseTo(expectedFrequencyScore, 1);
    expect(result.scoreBreakdown.impactScore).toBeCloseTo(expectedImpactScore, 1);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(expectedResolutionDifficultyScore);

    // 6. 優先度ランクの判定
    // priorityScore が84の場合、高優先度（70以上）
    expect(result.priorityRank).toBe('高');

    // 7. 色コード（優先度ランクに基づく）
    expect(result.colorCode).toBe('#FF0000');

    // 8. calculatedAt は ISO 8601 形式の有効な日時文字列
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate instanceof Date && !isNaN(calculatedDate.getTime())).toBe(true);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 9. 浮動小数点演算の精度検証（丸め誤差は小数第3位以下に留まる）
    const frequencyScorePrecision = Math.abs(
      result.scoreBreakdown.frequencyScore - expectedFrequencyScore
    );
    expect(frequencyScorePrecision).toBeLessThan(0.01);

    const impactScorePrecision = Math.abs(
      result.scoreBreakdown.impactScore - expectedImpactScore
    );
    expect(impactScorePrecision).toBeLessThan(0.01);

    // 10. オーバーフロー/アンダーフロー検証
    // 全スコアが有限数であること
    expect(Number.isFinite(result.priorityScore)).toBe(true);
    expect(Number.isFinite(result.scoreBreakdown.frequencyScore)).toBe(true);
    expect(Number.isFinite(result.scoreBreakdown.impactScore)).toBe(true);
    expect(Number.isFinite(result.scoreBreakdown.resolutionDifficultyScore)).toBe(true);

    // 11. スコア配分が正規化されていることを確認
    const totalScoreBreakdown =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalScoreBreakdown).toBeLessThanOrEqual(100);
  });
});