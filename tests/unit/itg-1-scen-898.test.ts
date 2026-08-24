import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Color Coding', () => {
  // SCEN-898: [normal] 課題優先度に基づく色分け表示ロジック - 優先度スコアが低い課題のとき、色分け表示用の低優先度フラグが立てられる
  test('should apply green color code for low priority score issue', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 25,
          keyword: 'documentation-update',
          impactLevel: 'low',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-dept-manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].highlightColor).toBe('green');
    expect(result.colorDistribution.green).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.processedAt).toBeTruthy();
  });
});