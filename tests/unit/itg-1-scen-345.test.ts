import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import type { IssuePriorityScoringInput, IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-345: Calculate priority score from frequency and impact score, determine rank and color code', () => {
    // Arrange: Prepare test inputs
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 40,
      impactScore: 60,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    // Calculate expected priority score using the design formula:
    // priorityScore = frequency × frequencyWeight + impactScore × impactWeight
    const expectedPriorityScore = 40 * 0.4 + 60 * 0.6; // 16 + 36 = 52

    // Act: Call the function
    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    // Assert: Verify output fields
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(52);
    expect(result.priorityRank).toBe('MEDIUM');
    expect(result.colorCode).toBe('YELLOW');
  });
});