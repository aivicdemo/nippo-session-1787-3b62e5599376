import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Assessment', () => {
  test('SCEN-1444: calculateIssuePriorityScore ranks issues by impact score in descending order', () => {
    // Setup: Test data for three issues with different impact scores
    const systemFailureIssue: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生',
      occurrenceFrequency: 5,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-A',
    };

    const minorBugIssue: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: '軽微なバグを発見',
      occurrenceFrequency: 2,
      impactScore: 30,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-A',
    };

    const docUpdateIssue: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'ドキュメント更新が必要',
      occurrenceFrequency: 1,
      impactScore: 10,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-A',
    };

    // Execute: Calculate priority scores for each issue
    const systemFailureResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(systemFailureIssue);
    const minorBugResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(minorBugIssue);
    const docUpdateResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(docUpdateIssue);

    // Assert: Verify impact score to priority rank mapping
    // System failure (impact 80) should have highest priority rank
    expect(systemFailureResult.priorityScore).toBe(80);
    expect(systemFailureResult.priorityRank).toBe('高');
    expect(systemFailureResult.colorCode).toBe('#FF0000');

    // Minor bug (impact 30) should have medium priority rank
    expect(minorBugResult.priorityScore).toBe(30);
    expect(minorBugResult.priorityRank).toBe('中');
    expect(minorBugResult.colorCode).toBe('#FFFF00');

    // Document update (impact 10) should have lowest priority rank
    expect(docUpdateResult.priorityScore).toBe(10);
    expect(docUpdateResult.priorityRank).toBe('低');
    expect(docUpdateResult.colorCode).toBe('#00FF00');

    // Verify descending order: system failure > minor bug > doc update
    expect(systemFailureResult.priorityScore).toBeGreaterThan(minorBugResult.priorityScore);
    expect(minorBugResult.priorityScore).toBeGreaterThan(docUpdateResult.priorityScore);

    // Verify score breakdown components exist and are reasonable
    expect(systemFailureResult.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(systemFailureResult.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(systemFailureResult.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Verify calculation timestamp is recorded
    expect(systemFailureResult.calculatedAt).toBeDefined();
    const calculatedDate = new Date(systemFailureResult.calculatedAt);
    expect(calculatedDate.getTime()).toBeLessThanOrEqual(Date.now());
    expect(calculatedDate.getTime()).toBeGreaterThan(Date.now() - 60000); // Within last minute
  });
});