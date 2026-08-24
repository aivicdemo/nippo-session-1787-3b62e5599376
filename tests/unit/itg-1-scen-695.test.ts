import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type HighlightThresholdInput, type HighlightThresholdOutput, type HighlightedIssue } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-695: [normal] 優先度スコアが閾値未満の課題は色分け表示されない
  test('should not highlight issues with priority score below threshold, and highlight those equal to or above threshold', () => {
    const thresholdScore = 60;
    const colorScheme = 'traffic_light';

    const issueA: HighlightThresholdInput['issues'][0] = {
      issueId: 'issue-a-001',
      keyword: 'Database connection timeout',
      priorityScore: 55,
      frequency: 3,
      impactScore: 50,
    };

    const issueB: HighlightThresholdInput['issues'][0] = {
      issueId: 'issue-b-002',
      keyword: 'Memory leak in production',
      priorityScore: 60,
      frequency: 5,
      impactScore: 75,
    };

    const issueC: HighlightThresholdInput['issues'][0] = {
      issueId: 'issue-c-003',
      keyword: 'API rate limiting failure',
      priorityScore: 65,
      frequency: 7,
      impactScore: 85,
    };

    const input: HighlightThresholdInput = {
      issues: [issueA, issueB, issueC],
      thresholdScore,
      colorScheme,
    };

    const output: HighlightThresholdOutput = prioritizeAndColorizeIssues(input);

    expect(output).toBeDefined();
    expect(output.highlightedIssues).toHaveLength(3);
    expect(output.appliedThreshold).toBe(60);

    const highlightedIssueA = output.highlightedIssues.find(
      (issue) => issue.issueId === 'issue-a-001'
    );
    expect(highlightedIssueA).toBeDefined();
    expect(highlightedIssueA?.shouldHighlight).toBe(false);
    expect(highlightedIssueA?.highlightColor).toBe('none');

    const highlightedIssueB = output.highlightedIssues.find(
      (issue) => issue.issueId === 'issue-b-002'
    );
    expect(highlightedIssueB).toBeDefined();
    expect(highlightedIssueB?.shouldHighlight).toBe(true);
    expect(highlightedIssueB?.highlightColor).not.toBe('none');

    const highlightedIssueC = output.highlightedIssues.find(
      (issue) => issue.issueId === 'issue-c-003'
    );
    expect(highlightedIssueC).toBeDefined();
    expect(highlightedIssueC?.shouldHighlight).toBe(true);
    expect(highlightedIssueC?.highlightColor).not.toBe('none');

    expect(output.highlightCount).toBe(2);
    expect(output.processedAt).toBeDefined();
  });
});