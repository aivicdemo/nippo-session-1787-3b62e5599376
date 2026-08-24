import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1310: [normal] ダッシュボード色分け表示機能 - 優先度スコアが中程度の課題が黄色で表示される
  test('should display medium-priority issue in yellow color when priority score is 50', () => {
    // Arrange
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 50,
        keyword: 'データベース接続エラー',
        impactLevel: 'medium',
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'user-12345',
    };

    // Act
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert
    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(50);
    expect(result.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    expect(result.processedAt).toBeDefined();
  });
});