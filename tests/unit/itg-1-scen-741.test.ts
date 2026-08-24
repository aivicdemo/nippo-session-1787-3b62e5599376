import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - calculateIssuePriorityScore', () => {
  // SCEN-741: [normal] 課題の自動抽出と優先度判定機能 - 発生頻度が高く、かつ波及度スコアが高い課題が最優先で表示される
  test('should calculate priority score with correct ranking based on occurrence frequency and impact score', () => {
    // Setup test data with three issues:
    // Issue A: frequency=5, impactScore=85 → combined score should be highest
    // Issue B: frequency=3, impactScore=70 → combined score should be second
    // Issue C: frequency=8, impactScore=60 → combined score should be third
    // Expected ranking formula: higher (frequency × impactScore / 100) = higher priority

    const issueA: IssuePriorityScoringInput = {
      issueId: 'issue-a-001',
      issueContent: 'Database connection timeout occurring during peak hours',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const issueB: IssuePriorityScoringInput = {
      issueId: 'issue-b-001',
      issueContent: 'API response time degradation in staging environment',
      occurrenceFrequency: 3,
      impactScore: 70,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.8,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const issueC: IssuePriorityScoringInput = {
      issueId: 'issue-c-001',
      issueContent: 'Occasional build pipeline failures in CI/CD workflow',
      occurrenceFrequency: 8,
      impactScore: 60,
      affectedTeamCount: 4,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    // Execute priority score calculation for each issue
    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);

    // Verify Issue A has highest priority score
    // Score calculation: occurrenceFrequency forms frequencyScore (40 max),
    // impactScore forms impactScore (40 max),
    // resolutionDaysAverage forms resolutionDifficultyScore (20 max)
    // Issue A: frequency=5 → ~13 points, impact=85 → ~34 points, resolution=2.5 → ~10 points
    // Total expected: ~57 (high priority)
    expect(resultA.priorityScore).toBeGreaterThan(resultB.priorityScore);
    expect(resultB.priorityScore).toBeGreaterThan(resultC.priorityScore);

    // Verify Issue A is marked as high priority
    expect(resultA.priorityRank).toBe('高');

    // Verify Issue B is marked as medium or lower priority
    expect(['中', '低']).toContain(resultB.priorityRank);

    // Verify Issue C is marked as medium or lower priority
    expect(['中', '低']).toContain(resultC.priorityRank);

    // Verify color coding reflects priority ranking
    expect(resultA.colorCode).toBe('#FF0000'); // Red for high priority

    // Verify score breakdown exists and has expected structure
    expect(resultA.scoreBreakdown).toHaveProperty('frequencyScore');
    expect(resultA.scoreBreakdown).toHaveProperty('impactScore');
    expect(resultA.scoreBreakdown).toHaveProperty('resolutionDifficultyScore');

    // Verify frequency score component (0-40 range)
    // Issue A has frequency=5, should map to reasonable portion of 40-point scale
    expect(resultA.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(resultA.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    // Verify impact score component (0-40 range)
    // Issue A has impactScore=85 (0-100 scale), should map to high portion of 40-point scale
    expect(resultA.scoreBreakdown.impactScore).toBeGreaterThan(30);
    expect(resultA.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    // Verify resolution difficulty score component (0-20 range)
    // Issue A has resolutionDaysAverage=2.5, should map to reasonable portion of 20-point scale
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThan(0);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Verify overall priority score is within valid range (1-100)
    expect(resultA.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultA.priorityScore).toBeLessThanOrEqual(100);

    // Verify calculatedAt timestamp is present and is ISO format
    expect(resultA.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify Issue A properties are preserved in output
    expect(resultA.issueId).toBe('issue-a-001');
  });
});