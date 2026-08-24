import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-562: [normal] 課題優先度判定機能 - 影響度スコアが高い課題ほど優先度ランクが高く判定される
  test('should assign priority ranks based on impact scores in descending order', () => {
    const issueA: any = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout under high load',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueB: any = {
      issueId: 'issue-002',
      issueContent: 'API response time degradation',
      occurrenceFrequency: 3,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueC: any = {
      issueId: 'issue-003',
      issueContent: 'Minor UI layout issue',
      occurrenceFrequency: 2,
      impactScore: 30,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);

    expect(resultA.priorityScore).toBeGreaterThan(resultB.priorityScore);
    expect(resultB.priorityScore).toBeGreaterThan(resultC.priorityScore);

    expect(resultA.priorityRank).toBe('高');
    expect(resultB.priorityRank).toBe('中');
    expect(resultC.priorityRank).toBe('低');

    expect(resultA.scoreBreakdown).toBeDefined();
    expect(resultA.scoreBreakdown.impactScore).toBe(40);
    expect(resultB.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(resultB.scoreBreakdown.impactScore).toBeLessThan(40);
    expect(resultC.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(resultC.scoreBreakdown.impactScore).toBeLessThan(40);

    expect(resultA.colorCode).toBe('#FF0000');
    expect(resultB.colorCode).toBe('#FFFF00');
    expect(resultC.colorCode).toBe('#00FF00');
  });
});