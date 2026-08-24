import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出 - 色分けマッピング対象外スコア値エラーハンドリング', () => {
  // SCEN-918
  it('色分けマッピング対象外の優先度スコア値が入力されたとき例外をスロー', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'テスト用課題',
      occurrenceFrequency: 5,
      impactScore: 150,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'team-alpha',
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/優先度スコア|範囲|0.*100/);
  });
});