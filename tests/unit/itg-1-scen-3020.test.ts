import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-3020: [edge] 課題優先度スコア自動計算機能 - 集計期間の開始日と終了日が同日である場合、その日に記録された課題のスコアが正確に計算される
  test('集計期間開始日と終了日が同日の場合、その日に記録された課題のスコアが正確に計算される', () => {
    const aggregationDate = new Date('2026-08-19T00:00:00Z');
    
    const testCaseA: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生しました',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2026-08-19',
      teamId: 'team-001'
    };

    const testCaseB: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'ドキュメント未更新',
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 3,
      resolutionDaysAverage: 3,
      reportingDate: '2026-08-19',
      teamId: 'team-001'
    };

    const testCaseC: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'マイナー改善案',
      occurrenceFrequency: 1,
      impactScore: 20,
      affectedTeamCount: 1,
      resolutionDaysAverage: 5,
      reportingDate: '2026-08-19',
      teamId: 'team-001'
    };

    const resultA = calculateIssuePriorityScore(testCaseA);
    const resultB = calculateIssuePriorityScore(testCaseB);
    const resultC = calculateIssuePriorityScore(testCaseC);

    expect(resultA.issueId).toBe('issue-001');
    expect(resultA.priorityScore).toBe(255);
    expect(resultA.priorityRank).toBe('高');
    expect(resultA.scoreBreakdown.frequencyScore).toBe(120);
    expect(resultA.scoreBreakdown.impactScore).toBe(30);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBe(4);
    expect(resultA.colorCode).toBe('#FF0000');

    expect(resultB.issueId).toBe('issue-002');
    expect(resultB.priorityScore).toBe(110);
    expect(resultB.priorityRank).toBe('中');
    expect(resultB.scoreBreakdown.frequencyScore).toBe(80);
    expect(resultB.scoreBreakdown.impactScore).toBe(18);
    expect(resultB.scoreBreakdown.resolutionDifficultyScore).toBe(6);
    expect(resultB.colorCode).toBe('#FFFF00');

    expect(resultC.issueId).toBe('issue-003');
    expect(resultC.priorityScore).toBe(30);
    expect(resultC.priorityRank).toBe('低');
    expect(resultC.scoreBreakdown.frequencyScore).toBe(40);
    expect(resultC.scoreBreakdown.impactScore).toBe(8);
    expect(resultC.scoreBreakdown.resolutionDifficultyScore).toBe(10);
    expect(resultC.colorCode).toBe('#00FF00');

    expect(resultA.calculatedAt).toBeDefined();
    expect(typeof resultA.calculatedAt).toBe('string');
  });
});