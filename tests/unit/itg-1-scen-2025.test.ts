import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('朝会報告管理システム - 課題優先度スコア計算', () => {
  // SCEN-2025: [normal] 複数対策案の承認フロー - 複数件の対策案が同時に登録される場合、各対策案について個別に承認フローが開始される
  test('複数の対策案が同時に登録された場合、各対策案について個別の優先度スコアが計算される', () => {
    // 対策案A: デプロイパイプラインの遅延
    const inputA: IssuePriorityScoringInput = {
      issueId: 'issue-a-001',
      issueContent: 'デプロイパイプラインの遅延により本番リリースが遅れている',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 7,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    // 対策案B: テストカバレッジ不足
    const inputB: IssuePriorityScoringInput = {
      issueId: 'issue-b-002',
      issueContent: 'テストカバレッジが60%に止まっており品質リスクが高い',
      occurrenceFrequency: 3,
      impactScore: 65,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    // 対策案C: ドキュメント更新漏れ
    const inputC: IssuePriorityScoringInput = {
      issueId: 'issue-c-003',
      issueContent: 'ドキュメント更新が遅れており新規メンバーのオンボーディングに支障が出ている',
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 1,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    // 各対策案に対して独立した優先度スコアを計算
    const outputA: IssuePriorityScoringOutput = calculateIssuePriorityScore(inputA);
    const outputB: IssuePriorityScoringOutput = calculateIssuePriorityScore(inputB);
    const outputC: IssuePriorityScoringOutput = calculateIssuePriorityScoringOutput(inputC);

    // 対策案Aの検証: 高頻度・高影響度・高解決難度 → 高優先度スコア
    // frequencyScore = (5 / max_frequency) * 40 ≈ (5 / 10) * 40 = 20
    // impactScore component = (85 / 100) * 40 = 34
    // resolutionDifficultyScore = (7 / 10) * 20 = 14
    // totalScore = 20 + 34 + 14 = 68 (中優先度)
    expect(outputA.issueId).toBe('issue-a-001');
    expect(outputA.priorityScore).toBeGreaterThanOrEqual(60);
    expect(outputA.priorityScore).toBeLessThanOrEqual(80);
    expect(outputA.priorityRank).toBe('中');
    expect(outputA.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(15);
    expect(outputA.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(25);
    expect(outputA.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(30);
    expect(outputA.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(outputA.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(10);
    expect(outputA.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(16);
    expect(outputA.colorCode).toBe('#FFFF00');
    expect(outputA.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 対策案Bの検証: 中程度の頻度・中程度の影響度 → 中優先度スコア
    // frequencyScore = (3 / 10) * 40 = 12
    // impactScore component = (65 / 100) * 40 = 26
    // resolutionDifficultyScore = (5 / 10) * 20 = 10
    // totalScore = 12 + 26 + 10 = 48 (中優先度)
    expect(outputB.issueId).toBe('issue-b-002');
    expect(outputB.priorityScore).toBeGreaterThanOrEqual(40);
    expect(outputB.priorityScore).toBeLessThanOrEqual(60);
    expect(outputB.priorityRank).toBe('中');
    expect(outputB.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(10);
    expect(outputB.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(14);
    expect(outputB.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(24);
    expect(outputB.scoreBreakdown.impactScore).toBeLessThanOrEqual(28);
    expect(outputB.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(8);
    expect(outputB.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(12);
    expect(outputB.colorCode).toBe('#FFFF00');

    // 対策案Cの検証: 低頻度・低影響度・低解決難度 → 低優先度スコア
    // frequencyScore = (2 / 10) * 40 = 8
    // impactScore component = (45 / 100) * 40 = 18
    // resolutionDifficultyScore = (3 / 10) * 20 = 6
    // totalScore = 8 + 18 + 6 = 32 (低優先度)
    expect(outputC.issueId).toBe('issue-c-003');
    expect(outputC.priorityScore).toBeGreaterThanOrEqual(25);
    expect(outputC.priorityScore).toBeLessThanOrEqual(40);
    expect(outputC.priorityRank).toBe('低');
    expect(outputC.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(6);
    expect(outputC.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(10);
    expect(outputC.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(16);
    expect(outputC.scoreBreakdown.impactScore).toBeLessThanOrEqual(20);
    expect(outputC.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(4);
    expect(outputC.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(8);
    expect(outputC.colorCode).toBe('#00FF00');

    // 各対策案のスコアが異なることを検証（独立した計算結果）
    expect(outputA.priorityScore).toBeGreaterThan(outputB.priorityScore);
    expect(outputB.priorityScore).toBeGreaterThan(outputC.priorityScore);

    // 各対策案が異なるissueIdを保持していることを確認
    const issueIds = new Set([outputA.issueId, outputB.issueId, outputC.issueId]);
    expect(issueIds.size).toBe(3);

    // 計算タイムスタンプが記録されていることを検証
    expect(outputA.calculatedAt).toBeDefined();
    expect(outputB.calculatedAt).toBeDefined();
    expect(outputC.calculatedAt).toBeDefined();
  });
});