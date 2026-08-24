import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1550
  test('複数課題の優先度ランク計算結果が逆順で入力された場合でも正しく再計算される', () => {
    const issueA: IssuePriorityScoringInput = {
      issueId: 'issue-a-001',
      issueContent: 'Database connection timeout occurring in production',
      occurrenceFrequency: 2,
      impactScore: 35,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueB: IssuePriorityScoringInput = {
      issueId: 'issue-b-002',
      issueContent: 'Critical API response delay affecting customer transactions',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 4,
      resolutionDaysAverage: 1.2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueC: IssuePriorityScoringInput = {
      issueId: 'issue-c-003',
      issueContent: 'Memory leak in batch processing module',
      occurrenceFrequency: 5,
      impactScore: 60,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);

    expect(resultA.priorityScore).toBe(45);
    expect(resultA.priorityRank).toBe('中');
    expect(resultA.colorCode).toBe('#FFFF00');

    expect(resultB.priorityScore).toBe(72);
    expect(resultB.priorityRank).toBe('高');
    expect(resultB.colorCode).toBe('#FF0000');

    expect(resultC.priorityScore).toBe(58);
    expect(resultC.priorityRank).toBe('中');
    expect(resultC.colorCode).toBe('#FFFF00');

    const sortedByScoreDescending = [resultB, resultC, resultA].sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    expect(sortedByScoreDescending[0].priorityScore).toBe(72);
    expect(sortedByScoreDescending[0].issueId).toBe('issue-b-002');
    expect(sortedByScoreDescending[0].priorityRank).toBe('高');

    expect(sortedByScoreDescending[1].priorityScore).toBe(58);
    expect(sortedByScoreDescending[1].issueId).toBe('issue-c-003');
    expect(sortedByScoreDescending[1].priorityRank).toBe('中');

    expect(sortedByScoreDescending[2].priorityScore).toBe(45);
    expect(sortedByScoreDescending[2].issueId).toBe('issue-a-001');
    expect(sortedByScoreDescending[2].priorityRank).toBe('中');
  });
});