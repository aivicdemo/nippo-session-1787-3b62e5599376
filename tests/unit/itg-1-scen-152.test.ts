import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-152: [edge] ダッシュボード色分け表示機能 - 優先度スコアが低い課題に灰色ハイライトが適用される
  test('should apply gray highlight color to low priority issues with score range 0-30', () => {
    const lowPriorityIssues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 10,
        keyword: 'Low Priority Issue 1',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-002',
        priorityScore: 20,
        keyword: 'Low Priority Issue 2',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-003',
        priorityScore: 30,
        keyword: 'Low Priority Issue 3',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: lowPriorityIssues,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toHaveProperty('colorizedIssues');
    expect(Array.isArray(result.colorizedIssues)).toBe(true);
    expect(result.colorizedIssues.length).toBe(3);

    result.colorizedIssues.forEach((colorizedIssue) => {
      expect(colorizedIssue).toHaveProperty('issueId');
      expect(colorizedIssue).toHaveProperty('shouldHighlight');
      expect(colorizedIssue).toHaveProperty('highlightColor');

      const score = lowPriorityIssues.find(
        (issue) => issue.issueId === colorizedIssue.issueId,
      )?.priorityScore;

      expect(score).toBeLessThanOrEqual(30);
      expect(colorizedIssue.highlightColor).toBe('green');
    });

    expect(result.colorDistribution).toHaveProperty('red');
    expect(result.colorDistribution).toHaveProperty('yellow');
    expect(result.colorDistribution).toHaveProperty('green');

    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(3);

    expect(result).toHaveProperty('processedAt');
    expect(typeof result.processedAt).toBe('string');

    const processedAtDate = new Date(result.processedAt);
    expect(processedAtDate instanceof Date).toBe(true);
    expect(isNaN(processedAtDate.getTime())).toBe(false);
  });
});