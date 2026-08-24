import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Colorize Issues', () => {
  test('SCEN-701: Issues with low frequency and high impact score should be highlighted with assigned color', () => {
    // Setup: Mock data for three issues with specific frequency and impact scores
    const issueA = {
      issueId: 'issue-a-001',
      keyword: 'Database Connection Timeout',
      priorityScore: 75,
      frequency: 2,
      impactScore: 75,
    };

    const issueB = {
      issueId: 'issue-b-002',
      keyword: 'API Response Delay',
      priorityScore: 80,
      frequency: 1,
      impactScore: 80,
    };

    const issueC = {
      issueId: 'issue-c-003',
      keyword: 'Minor UI Glitch',
      priorityScore: 60,
      frequency: 5,
      impactScore: 60,
    };

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input = {
      issues: [issueA, issueB, issueC],
      colorThresholds: colorThresholds,
      requestedBy: 'user-manager-001',
    };

    // Execute the function
    const result = prioritizeAndColorizeIssues(input);

    // Assertions
    expect(result.colorizedIssues).toHaveLength(3);

    // Issue A: frequency=2 (low), impactScore=75 (>= redThresholdMin 70)
    // Should be colored red
    const colorizedA = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-a-001'
    );
    expect(colorizedA).toBeDefined();
    expect(colorizedA?.highlightColor).toBe('red');

    // Issue B: frequency=1 (low), impactScore=80 (>= redThresholdMin 70)
    // Should be colored red
    const colorizedB = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-b-002'
    );
    expect(colorizedB).toBeDefined();
    expect(colorizedB?.highlightColor).toBe('red');

    // Issue C: frequency=5 (high), impactScore=60 (< redThresholdMin 70, < yellowThresholdMin 40 is false)
    // Since frequency is high (5), it does not meet the low-frequency condition
    // impactScore 60 is between yellowThresholdMin (40) and redThresholdMin (70)
    // Should be colored yellow
    const colorizedC = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-c-003'
    );
    expect(colorizedC).toBeDefined();
    expect(colorizedC?.highlightColor).toBe('yellow');

    // Color distribution verification
    expect(result.colorDistribution.red).toBe(2);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);

    // Timestamp should be recorded
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate instanceof Date && !isNaN(processedDate.getTime())).toBe(
      true
    );
  });
});