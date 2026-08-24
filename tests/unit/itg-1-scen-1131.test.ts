import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue prioritization and colorization', () => {
  // SCEN-1131: [normal] 課題の色分け分類機能 - 最高優先度課題がハイライト色として分類される
  test('should colorize high-priority issues with red highlight color', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'データベース接続エラー',
          impactLevel: 'high'
        },
        {
          issueId: 'issue-002',
          priorityScore: 55,
          keyword: 'ドキュメント不足',
          impactLevel: 'medium'
        },
        {
          issueId: 'issue-003',
          priorityScore: 25,
          keyword: 'コード整形',
          impactLevel: 'low'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-manager-001'
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);
    
    const highPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(highPriorityIssue).toBeDefined();
    expect(highPriorityIssue?.highlightColor).toBe('red');
    expect(highPriorityIssue?.shouldHighlight).toBe(true);
    
    const mediumPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(mediumPriorityIssue).toBeDefined();
    expect(mediumPriorityIssue?.highlightColor).toBe('yellow');
    expect(mediumPriorityIssue?.shouldHighlight).toBe(false);
    
    const lowPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-003'
    );
    expect(lowPriorityIssue).toBeDefined();
    expect(lowPriorityIssue?.highlightColor).toBe('green');
    expect(lowPriorityIssue?.shouldHighlight).toBe(false);

    expect(result.colorDistribution).toEqual({
      red: 1,
      yellow: 1,
      green: 1
    });

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});