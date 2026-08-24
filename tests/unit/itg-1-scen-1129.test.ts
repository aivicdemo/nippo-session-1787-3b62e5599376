import { describe, it, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - Dashboard issue display with color coding', () => {
  it('SCEN-1129: [normal] stable sort by priority score - equal priority issues maintain database insertion order', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 60,
          keyword: 'Database connection timeout',
          impactLevel: 'medium'
        },
        {
          issueId: 'issue-002',
          priorityScore: 60,
          keyword: 'API response delay',
          impactLevel: 'medium'
        },
        {
          issueId: 'issue-003',
          priorityScore: 60,
          keyword: 'Memory leak in cache',
          impactLevel: 'medium'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-001'
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[1].issueId).toBe('issue-002');
    expect(result.colorizedIssues[2].issueId).toBe('issue-003');
    
    expect(result.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(result.colorizedIssues[1].highlightColor).toBe('yellow');
    expect(result.colorizedIssues[2].highlightColor).toBe('yellow');
    
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(3);
    expect(result.colorDistribution.green).toBe(0);
    
    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe('string');
  });
});