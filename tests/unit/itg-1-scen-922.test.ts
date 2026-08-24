import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-922: [edge] 課題優先度スコア算出機能 - 発生頻度が優先度スコア閾値（100）直上（100.01）のとき、最高優先度色で表示される
  test('発生頻度100.01は優先度スコア閾値を超え、最高優先度色（赤）で表示される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'システムパフォーマンス低下',
      occurrenceFrequency: 100.01,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'TEAM-A'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // 発生頻度が100.01のため、優先度スコアは最大値（100）に達する
    expect(result.priorityScore).toBe(100);
    
    // 優先度ランクは「高」と判定される
    expect(result.priorityRank).toBe('高');
    
    // 色コードは赤色（#FF0000）で表示される
    expect(result.colorCode).toBe('#FF0000');
    
    // scoreBreakdownを確認：発生頻度スコアは40（最大値）に達する
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    
    // issueIdが入力値と一致すること
    expect(result.issueId).toBe('ISSUE-001');
    
    // calculatedAtがISO 8601形式の文字列であること
    expect(typeof result.calculatedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.calculatedAt)).toBe(true);
  });
});