import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-738: [normal] 課題の自動抽出と優先度判定機能 - 複数日報から複数の異なる課題が抽出され、優先度順に一覧表示される
  test('should extract and prioritize multiple issues from multiple daily reports in descending score order', () => {
    // Setup test data for Issue 1: Database connection error
    const issue1Input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻発',
      occurrenceFrequency: 2,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issue1Result = calculateIssuePriorityScore(issue1Input);

    // Setup test data for Issue 2: Verbose log output
    const issue2Input: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'ログ出力が冗長',
      occurrenceFrequency: 2,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.0,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issue2Result = calculateIssuePriorityScore(issue2Input);

    // Setup test data for Issue 3: Team communication gap
    const issue3Input: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'チーム間の進捗共有が不足',
      occurrenceFrequency: 1,
      impactScore: 45,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issue3Result = calculateIssuePriorityScore(issue3Input);

    // Verify that all three issues have been scored
    expect(issue1Result).toHaveProperty('issueId', 'issue-001');
    expect(issue1Result).toHaveProperty('priorityScore');
    expect(issue1Result).toHaveProperty('priorityRank');
    expect(issue1Result).toHaveProperty('scoreBreakdown');
    expect(issue1Result).toHaveProperty('colorCode');
    expect(issue1Result).toHaveProperty('calculatedAt');

    expect(issue2Result).toHaveProperty('issueId', 'issue-002');
    expect(issue2Result).toHaveProperty('priorityScore');
    expect(issue2Result).toHaveProperty('priorityRank');

    expect(issue3Result).toHaveProperty('issueId', 'issue-003');
    expect(issue3Result).toHaveProperty('priorityScore');
    expect(issue3Result).toHaveProperty('priorityRank');

    // Verify priority score ranking: Issue 1 > Issue 2 > Issue 3
    expect(issue1Result.priorityScore).toBeGreaterThan(issue2Result.priorityScore);
    expect(issue2Result.priorityScore).toBeGreaterThan(issue3Result.priorityScore);

    // Verify score breakdown contains valid components
    expect(issue1Result.scoreBreakdown).toHaveProperty('frequencyScore');
    expect(issue1Result.scoreBreakdown).toHaveProperty('impactScore');
    expect(issue1Result.scoreBreakdown).toHaveProperty('resolutionDifficultyScore');

    // Verify frequency score (0-40 range) increases with occurrence frequency
    expect(issue1Result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(issue1Result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(issue1Result.scoreBreakdown.frequencyScore).toBeGreaterThan(
      issue3Result.scoreBreakdown.frequencyScore
    );

    // Verify impact score (0-40 range) correlates with impactScore input
    expect(issue1Result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(issue1Result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(issue1Result.scoreBreakdown.impactScore).toBeGreaterThan(
      issue3Result.scoreBreakdown.impactScore
    );

    // Verify resolution difficulty score (0-20 range)
    expect(issue1Result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(issue1Result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Verify total priority score is in valid range (1-100)
    expect(issue1Result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(issue1Result.priorityScore).toBeLessThanOrEqual(100);
    expect(issue2Result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(issue2Result.priorityScore).toBeLessThanOrEqual(100);
    expect(issue3Result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(issue3Result.priorityScore).toBeLessThanOrEqual(100);

    // Verify priority rank assignment based on score
    // Issue 1 with highest score should be ranked 'high'
    expect(issue1Result.priorityRank).toMatch(/高|high/i);

    // Issue 2 should be ranked 'medium'
    expect(issue2Result.priorityRank).toMatch(/中|medium/i);

    // Issue 3 with lowest score should be ranked 'low'
    expect(issue3Result.priorityRank).toMatch(/低|low/i);

    // Verify color codes are correctly assigned based on priority ranks
    expect(issue1Result.colorCode).toBe('#FF0000'); // Red for high priority
    expect(issue2Result.colorCode).toBe('#FFFF00'); // Yellow for medium priority
    expect(issue3Result.colorCode).toBe('#00FF00'); // Green for low priority

    // Verify calculated timestamps are ISO 8601 format
    expect(issue1Result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(issue2Result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(issue3Result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify all issues have their issue IDs preserved
    expect(issue1Result.issueId).toBe('issue-001');
    expect(issue2Result.issueId).toBe('issue-002');
    expect(issue3Result.issueId).toBe('issue-003');
  });
});