import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-506
  test('課題キーワード出現頻度が閾値100%未満で優先度が1段階低下する', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生した',
      occurrenceFrequency: 99,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const resultAt99Percent = calculateIssuePriorityScore(input);

    const inputAt100Percent = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生した',
      occurrenceFrequency: 100,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const resultAt100Percent = calculateIssuePriorityScore(inputAt100Percent);

    const scoreDifference = resultAt100Percent.priorityScore - resultAt99Percent.priorityScore;

    expect(resultAt99Percent.priorityScore).toBeLessThan(resultAt100Percent.priorityScore);
    expect(scoreDifference).toBeGreaterThan(0);
    expect(resultAt99Percent.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultAt99Percent.priorityScore).toBeLessThanOrEqual(100);
  });
});