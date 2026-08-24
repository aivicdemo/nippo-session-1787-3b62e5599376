import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-725: [edge] 課題優先度スコアによるダッシュボード強調表示機能 - 優先度スコアが閾値ちょうど（例：70）の課題をハイライト表示する
  test('should highlight issue with priority score exactly at threshold (70) with different style than below-threshold issues', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 69,
          keyword: 'Database connection timeout',
          impactLevel: 'medium',
        },
        {
          issueId: 'issue-002',
          priorityScore: 70,
          keyword: 'Critical database deadlock',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-003',
          priorityScore: 71,
          keyword: 'System performance degradation',
          impactLevel: 'high',
        },
      ],
      colorThresholds: {
        redThresholdMin: 80,
        yellowThresholdMin: 70,
      },
      requestedBy: 'user-dept-chief-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(3);
    expect(result.processedAt).toBeDefined();

    const issue_score_69 = result.colorizedIssues.find((issue) => issue.issueId === 'issue-001');
    const issue_score_70 = result.colorizedIssues.find((issue) => issue.issueId === 'issue-002');
    const issue_score_71 = result.colorizedIssues.find((issue) => issue.issueId === 'issue-003');

    expect(issue_score_69).toBeDefined();
    expect(issue_score_70).toBeDefined();
    expect(issue_score_71).toBeDefined();

    expect(issue_score_69!.priorityScore).toBe(69);
    expect(issue_score_70!.priorityScore).toBe(70);
    expect(issue_score_71!.priorityScore).toBe(71);

    expect(issue_score_69!.highlightColor).toBe('green');
    expect(issue_score_70!.highlightColor).toBe('yellow');
    expect(issue_score_71!.highlightColor).toBe('yellow');

    expect(issue_score_69!.shouldHighlight).toBe(false);
    expect(issue_score_70!.shouldHighlight).toBe(true);
    expect(issue_score_71!.shouldHighlight).toBe(true);

    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(1);
  });
});