import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別色分け表示機能', () => {
  // SCEN-1021
  test('優先度の低い課題が部長向けダッシュボードで色分けされて表示される', () => {
    const redThresholdMin = 70;
    const yellowThresholdMin = 40;

    const lowPriorityIssues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 25,
        keyword: '議事録作成',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-002',
        priorityScore: 30,
        keyword: 'メール確認',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-003',
        priorityScore: 35,
        keyword: '書類整理',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: redThresholdMin,
      yellowThresholdMin: yellowThresholdMin,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: lowPriorityIssues,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);

    const firstIssue = result.colorizedIssues.find((issue) => issue.issueId === 'issue-001');
    expect(firstIssue).toBeDefined();
    expect(firstIssue?.highlightColor).toBe('green');
    expect(firstIssue?.shouldHighlight).toBe(false);

    const secondIssue = result.colorizedIssues.find((issue) => issue.issueId === 'issue-002');
    expect(secondIssue).toBeDefined();
    expect(secondIssue?.highlightColor).toBe('green');
    expect(secondIssue?.shouldHighlight).toBe(false);

    const thirdIssue = result.colorizedIssues.find((issue) => issue.issueId === 'issue-003');
    expect(thirdIssue).toBeDefined();
    expect(thirdIssue?.highlightColor).toBe('green');
    expect(thirdIssue?.shouldHighlight).toBe(false);

    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(3);

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});