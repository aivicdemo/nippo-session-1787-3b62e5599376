import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-953
  test('赤色の最小閾値が黄色の最小閾値より大きいとき矛盾検出エラーを返す', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const thresholdConfig = {
      highPriorityThreshold: 75,
      mediumPriorityThreshold: 50,
      redThresholdMin: 75,
      yellowThresholdMin: 50,
    };

    expect(() => {
      calculateIssuePriorityScore(input, thresholdConfig);
    }).toThrow(/THRESHOLD_CONFIG_ERROR/);
  });
});