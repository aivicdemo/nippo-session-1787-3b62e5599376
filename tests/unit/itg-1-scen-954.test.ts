import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-954
  it('閾値設定で黄色の最小閾値が緑色の最小閾値より大きいとき矛盾検出エラーを返す', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-A',
      colorThresholds: {
        greenMinThreshold: 30,
        yellowMinThreshold: 50,
        redMinThreshold: 80,
      },
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(
      /THRESHOLD_INCONSISTENCY/
    );
  });
});