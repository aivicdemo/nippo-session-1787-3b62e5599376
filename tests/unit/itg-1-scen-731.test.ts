import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-731: [edge] 課題優先度スコアによるダッシュボード強調表示機能 - 優先度スコアが高い順に並んだ状態で、スコアが逆順の課題リストを正しく色分けできる
  test('should colorize and sort issues by priority score in descending order even when input is reversed', () => {
    const reverseOrderedIssues = [
      {
        issueId: 'issue-e',
        priorityScore: 45,
        keyword: 'Issue E',
        impactLevel: 'low'
      },
      {
        issueId: 'issue-d',
        priorityScore: 65,
        keyword: 'Issue D',
        impactLevel: 'medium'
      },
      {
        issueId: 'issue-c',
        priorityScore: 72,
        keyword: 'Issue C',
        impactLevel: 'medium'
      },
      {
        issueId: 'issue-b',
        priorityScore: 87,
        keyword: 'Issue B',
        impactLevel: 'high'
      },
      {
        issueId: 'issue-a',
        priorityScore: 95,
        keyword: 'Issue A',
        impactLevel: 'high'
      }
    ];

    const colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 60
    };

    const requestedBy = 'user-12345';

    const result = prioritizeAndColorizeIssues(
      reverseOrderedIssues,
      colorThresholds,
      requestedBy
    );

    expect(result.colorizedIssues).toHaveLength(5);

    expect(result.colorizedIssues[0].issueId).toBe('issue-a');
    expect(result.colorizedIssues[0].priorityScore).toBe(95);
    expect(result.colorizedIssues[0].highlightColor).toBe('red');

    expect(result.colorizedIssues[1].issueId).toBe('issue-b');
    expect(result.colorizedIssues[1].priorityScore).toBe(87);
    expect(result.colorizedIssues[1].highlightColor).toBe('red');

    expect(result.colorizedIssues[2].issueId).toBe('issue-c');
    expect(result.colorizedIssues[2].priorityScore).toBe(72);
    expect(result.colorizedIssues[2].highlightColor).toBe('yellow');

    expect(result.colorizedIssues[3].issueId).toBe('issue-d');
    expect(result.colorizedIssues[3].priorityScore).toBe(65);
    expect(result.colorizedIssues[3].highlightColor).toBe('yellow');

    expect(result.colorizedIssues[4].issueId).toBe('issue-e');
    expect(result.colorizedIssues[4].priorityScore).toBe(45);
    expect(result.colorizedIssues[4].highlightColor).toBe('none');

    expect(result.colorDistribution.red).toBe(2);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(0);

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});