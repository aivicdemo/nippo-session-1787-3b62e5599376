import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Issue extraction and prioritization functionality', () => {
  // SCEN-1511: [normal] 課題優先度スコア算出機能 - 前週の日報から複数件の課題が抽出された場合、全課題に対して優先度スコアが算出される
  test('should calculate priority scores for all extracted issues from multiple reports', () => {
    const testIssue1: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト問題',
      occurrenceFrequency: 3,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-08',
      teamId: 'team-001'
    };

    const testIssue2: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'API仕様書の更新遅延',
      occurrenceFrequency: 5,
      impactScore: 72,
      affectedTeamCount: 4,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-09',
      teamId: 'team-001'
    };

    const testIssue3: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'テスト環境構築の停滞',
      occurrenceFrequency: 2,
      impactScore: 38,
      affectedTeamCount: 1,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-10',
      teamId: 'team-001'
    };

    const result1: IssuePriorityScoringOutput = calculateIssuePriorityScore(testIssue1);
    const result2: IssuePriorityScoringOutput = calculateIssuePriorityScore(testIssue2);
    const result3: IssuePriorityScoringOutput = calculateIssuePriorityScore(testIssue3);

    // 課題1の検証: 発生頻度スコア（0-40）= (3/5)*40 = 24、影響度スコア（0-40）= 45*0.4 = 18、解決難度スコア（0-20）= (2/5)*20 = 8、合計 = 24+18+8 = 50
    expect(result1.issueId).toBe('issue-001');
    expect(result1.priorityScore).toBe(50);
    expect(result1.priorityRank).toBe('中');
    expect(result1.scoreBreakdown.frequencyScore).toBe(24);
    expect(result1.scoreBreakdown.impactScore).toBe(18);
    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBe(8);
    expect(result1.colorCode).toBe('#FFFF00');

    // 課題2の検証: 発生頻度スコア（0-40）= (5/5)*40 = 40、影響度スコア（0-40）= 72*0.4 = 28.8 ≈ 29、解決難度スコア（0-20）= (3/5)*20 = 12、合計 = 40+29+12 = 81
    expect(result2.issueId).toBe('issue-002');
    expect(result2.priorityScore).toBe(81);
    expect(result2.priorityRank).toBe('高');
    expect(result2.scoreBreakdown.frequencyScore).toBe(40);
    expect(result2.scoreBreakdown.impactScore).toBe(29);
    expect(result2.scoreBreakdown.resolutionDifficultyScore).toBe(12);
    expect(result2.colorCode).toBe('#FF0000');

    // 課題3の検証: 発生頻度スコア（0-40）= (2/5)*40 = 16、影響度スコア（0-40）= 38*0.4 = 15.2 ≈ 15、解決難度スコア（0-20）= (4/5)*20 = 16、合計 = 16+15+16 = 47
    expect(result3.issueId).toBe('issue-003');
    expect(result3.priorityScore).toBe(47);
    expect(result3.priorityRank).toBe('中');
    expect(result3.scoreBreakdown.frequencyScore).toBe(16);
    expect(result3.scoreBreakdown.impactScore).toBe(15);
    expect(result3.scoreBreakdown.resolutionDifficultyScore).toBe(16);
    expect(result3.colorCode).toBe('#FFFF00');

    // すべての課題がスコアを持つことを確認
    expect(result1.priorityScore).toBeDefined();
    expect(result2.priorityScore).toBeDefined();
    expect(result3.priorityScore).toBeDefined();

    // スコアが1-100の範囲内であることを確認
    expect(result1.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result1.priorityScore).toBeLessThanOrEqual(100);
    expect(result2.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result2.priorityScore).toBeLessThanOrEqual(100);
    expect(result3.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result3.priorityScore).toBeLessThanOrEqual(100);

    // 計算実行日時が記録されていることを確認
    expect(result1.calculatedAt).toBeDefined();
    expect(result2.calculatedAt).toBeDefined();
    expect(result3.calculatedAt).toBeDefined();

    // ISO 8601形式であることを確認
    expect(result1.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result2.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result3.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});