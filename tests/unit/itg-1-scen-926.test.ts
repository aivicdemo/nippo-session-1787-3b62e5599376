import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  it('SCEN-926: 発生頻度と影響度の計算で端数が発生したとき、丸め処理後の正確なスコアで順序付けされる', () => {
    // テストケース1: 発生頻度3.7、影響度2.4（スコア 3.7 * 2.4 = 8.88 → 9）
    const input1: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 3.7,
      impactScore: 24,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.2,
      reportingDate: '2024-01-15T11:00:00Z',
      teamId: 'team-alpha'
    };

    const output1: IssuePriorityScoringOutput = calculateIssuePriorityScore(input1);
    expect(output1.issueId).toBe('issue-001');
    expect(output1.priorityScore).toBe(9);
    expect(output1.priorityRank).toBe('高');
    expect(output1.colorCode).toBe('#FF0000');
    expect(output1.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(output1.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(output1.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThan(0);

    // テストケース2: 発生頻度2.1、影響度4.2（スコア 2.1 * 4.2 = 8.82 → 9）
    const input2: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'API response delay',
      occurrenceFrequency: 2.1,
      impactScore: 42,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T11:05:00Z',
      teamId: 'team-alpha'
    };

    const output2: IssuePriorityScoringOutput = calculateIssuePriorityScore(input2);
    expect(output2.issueId).toBe('issue-002');
    expect(output2.priorityScore).toBe(9);
    expect(output2.priorityRank).toBe('高');

    // テストケース3: 発生頻度5.5、影響度1.8（スコア 5.5 * 1.8 = 9.9 → 10）
    const input3: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'Memory leak in background process',
      occurrenceFrequency: 5.5,
      impactScore: 18,
      affectedTeamCount: 5,
      resolutionDaysAverage: 3.1,
      reportingDate: '2024-01-15T11:10:00Z',
      teamId: 'team-alpha'
    };

    const output3: IssuePriorityScoringOutput = calculateIssuePriorityScore(input3);
    expect(output3.issueId).toBe('issue-003');
    expect(output3.priorityScore).toBe(10);
    expect(output3.priorityRank).toBe('高');
    expect(output3.colorCode).toBe('#FF0000');

    // 検証: スコア順序付け（降順）
    // スコア10（8.88 * 1.12） > スコア9（3.7 * 2.4 = 8.88） > スコア9（2.1 * 4.2 = 8.82）
    const allOutputs = [output1, output2, output3];
    const sortedByScore = allOutputs.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      // 同一スコア内での安定順序付け: scoreBreakdownの合計値で判定
      const aTotal = a.scoreBreakdown.frequencyScore + a.scoreBreakdown.impactScore + a.scoreBreakdown.resolutionDifficultyScore;
      const bTotal = b.scoreBreakdown.frequencyScore + b.scoreBreakdown.impactScore + b.scoreBreakdown.resolutionDifficultyScore;
      return bTotal - aTotal;
    });

    expect(sortedByScore[0].priorityScore).toBe(10);
    expect(sortedByScore[1].priorityScore).toBe(9);
    expect(sortedByScore[2].priorityScore).toBe(9);
    expect(sortedByScore[0].issueId).toBe('issue-003');
  });
});