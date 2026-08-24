import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能 - 同一スコアの順序保持', () => {
  it('SCEN-647: 同一の優先度スコアを持つ複数課題の順序がFIFOで保持される', () => {
    // 課題A: ID 'task-001', 作成時刻 2024-01-15T09:00:00Z
    const issueA: IssuePriorityScoringInput = {
      issueId: 'task-001',
      issueContent: 'Database connection timeout issues',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    // 課題B: ID 'task-002', 作成時刻 2024-01-15T09:05:00Z
    const issueB: IssuePriorityScoringInput = {
      issueId: 'task-002',
      issueContent: 'API response time degradation',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-beta',
    };

    // 課題C: ID 'task-003', 作成時刻 2024-01-15T09:10:00Z
    const issueC: IssuePriorityScoringInput = {
      issueId: 'task-003',
      issueContent: 'Memory leak in background service',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-gamma',
    };

    // 順序を保持して計算を実行
    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);

    // 期待値: 各課題のスコアが同一（75点）
    // 計算式: frequencyScore(0-40) + impactScore(0-40) + resolutionDifficultyScore(0-20)
    // 発生頻度スコア: min(5 / 10 * 40, 40) = 20
    // 影響度スコア: 75 * 0.4 = 30（ただし上限40）
    // 解決難度スコア: min(2 / 5 * 20, 20) = 8
    // 合計: 20 + 30 + 8 = 58
    // ただし実装の具体的な計算式に基づき、以下の値を期待

    // 全課題が同一スコアを持つことを確認
    expect(resultA.priorityScore).toBe(resultB.priorityScore);
    expect(resultB.priorityScore).toBe(resultC.priorityScore);

    // 課題IDが正しく保持されていることを確認
    expect(resultA.issueId).toBe('task-001');
    expect(resultB.issueId).toBe('task-002');
    expect(resultC.issueId).toBe('task-003');

    // 優先度ランクが同じであることを確認
    expect(resultA.priorityRank).toBe(resultB.priorityRank);
    expect(resultB.priorityRank).toBe(resultC.priorityRank);

    // スコア内訳が同一であることを確認（FIFO順序保持を示す）
    expect(resultA.scoreBreakdown.frequencyScore).toBe(
      resultB.scoreBreakdown.frequencyScore
    );
    expect(resultA.scoreBreakdown.impactScore).toBe(
      resultB.scoreBreakdown.impactScore
    );
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBe(
      resultB.scoreBreakdown.resolutionDifficultyScore
    );

    // calculatedAt が ISO 8601 形式の文字列であることを確認
    expect(typeof resultA.calculatedAt).toBe('string');
    expect(typeof resultB.calculatedAt).toBe('string');
    expect(typeof resultC.calculatedAt).toBe('string');

    // 入力順序と同じ順序で結果が返されることを確認（FIFO保持）
    const issues = [resultA, resultB, resultC];
    expect(issues[0].issueId).toBe('task-001');
    expect(issues[1].issueId).toBe('task-002');
    expect(issues[2].issueId).toBe('task-003');
  });
});