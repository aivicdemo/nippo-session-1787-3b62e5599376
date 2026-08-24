import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-694: [normal] 優先度別課題ハイライト表示機能 - 優先度スコアが閾値以上の課題が色分け表示される
  test('should highlight and colorize issues with priority score at or above threshold', () => {
    const testIssues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 65,
        keyword: '課題A',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 58,
        keyword: '課題B',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-003',
        priorityScore: 72,
        keyword: '課題C',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-004',
        priorityScore: 45,
        keyword: '課題D',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 60,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: testIssues,
      colorThresholds: colorThresholds,
      requestedBy: 'user-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(4);

    const issueA = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(issueA).toBeDefined();
    expect(issueA?.shouldHighlight).toBe(true);
    expect(issueA?.highlightColor).toBe('red');

    const issueB = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(issueB).toBeDefined();
    expect(issueB?.shouldHighlight).toBe(false);
    expect(issueB?.highlightColor).toBe('yellow');

    const issueC = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-003'
    );
    expect(issueC).toBeDefined();
    expect(issueC?.shouldHighlight).toBe(true);
    expect(issueC?.highlightColor).toBe('red');

    const issueD = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-004'
    );
    expect(issueD).toBeDefined();
    expect(issueD?.shouldHighlight).toBe(false);
    expect(issueD?.highlightColor).toBe('yellow');

    expect(result.colorDistribution.red).toBe(2);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(0);

    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe('string');
  });
});