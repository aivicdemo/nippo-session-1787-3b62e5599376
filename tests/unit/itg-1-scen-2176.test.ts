import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-2176
  test('発生頻度が閾値ちょうど（5回）の課題は基準優先度で順序付けされる', () => {
    const issue_a_input: IssuePriorityScoringInput = {
      issueId: 'issue-a-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    const issue_b_input: IssuePriorityScoringInput = {
      issueId: 'issue-b-002',
      issueContent: 'API response delay',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    const issue_c_input: IssuePriorityScoringInput = {
      issueId: 'issue-c-003',
      issueContent: 'Memory leak in cache',
      occurrenceFrequency: 7,
      impactScore: 50,
      affectedTeamCount: 1,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    const result_a: IssuePriorityScoringOutput = calculateIssuePriorityScore(issue_a_input);
    const result_b: IssuePriorityScoringOutput = calculateIssuePriorityScore(issue_b_input);
    const result_c: IssuePriorityScoringOutput = calculateIssuePriorityScore(issue_c_input);

    expect(result_a.issueId).toBe('issue-a-001');
    expect(result_b.issueId).toBe('issue-b-002');
    expect(result_c.issueId).toBe('issue-c-003');

    expect(typeof result_a.priorityScore).toBe('number');
    expect(typeof result_b.priorityScore).toBe('number');
    expect(typeof result_c.priorityScore).toBe('number');

    expect(result_a.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result_a.priorityScore).toBeLessThanOrEqual(100);
    expect(result_b.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result_b.priorityScore).toBeLessThanOrEqual(100);
    expect(result_c.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result_c.priorityScore).toBeLessThanOrEqual(100);

    const scores = [
      { score: result_a.priorityScore, label: 'A' },
      { score: result_b.priorityScore, label: 'B' },
      { score: result_c.priorityScore, label: 'C' }
    ];

    const sorted_scores = scores.sort((x, y) => y.score - x.score);

    expect(sorted_scores[0].label).toBe('B');
    expect(sorted_scores[1].label).toBe('A');
    expect(sorted_scores[2].label).toBe('C');

    expect(result_a.scoreBreakdown).toBeDefined();
    expect(result_a.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result_a.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result_a.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result_a.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result_a.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result_a.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(result_a.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result_b.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result_c.priorityRank).toMatch(/^(高|中|低)$/);

    expect(result_a.colorCode).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(result_b.colorCode).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(result_c.colorCode).toMatch(/^#[0-9A-Fa-f]{6}$/);

    expect(result_a.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result_b.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result_c.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});