import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1097
  test('should highlight the highest priority score issue with dedicated color in dashboard', () => {
    const mockIssues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 95,
        keyword: 'critical-database-failure',
        impactLevel: 'high'
      },
      {
        issueId: 'issue-002',
        priorityScore: 60,
        keyword: 'moderate-performance-issue',
        impactLevel: 'medium'
      },
      {
        issueId: 'issue-003',
        priorityScore: 45,
        keyword: 'low-priority-maintenance',
        impactLevel: 'low'
      }
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const requestedByUserId = 'user-manager-001';

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: mockIssues,
      colorThresholds: colorThresholds,
      requestedBy: requestedByUserId
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);

    const highestPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(highestPriorityIssue).toBeDefined();
    expect(highestPriorityIssue?.priorityScore).toBe(95);
    expect(highestPriorityIssue?.colorCode).toBe('#FF0000');

    const moderatePriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(moderatePriorityIssue).toBeDefined();
    expect(moderatePriorityIssue?.priorityScore).toBe(60);
    expect(moderatePriorityIssue?.colorCode).toBe('#FF0000');

    const lowPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-003'
    );
    expect(lowPriorityIssue).toBeDefined();
    expect(lowPriorityIssue?.priorityScore).toBe(45);
    expect(lowPriorityIssue?.colorCode).toBe('#FFFF00');

    expect(result.colorDistribution).toEqual({
      red: 2,
      yellow: 1,
      green: 0
    });

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});