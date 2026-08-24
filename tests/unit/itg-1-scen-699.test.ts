import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-699
  test('同じ入力で2回実行した場合、同じハイライト表示結果が返却される', () => {
    const testInput: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'データベース接続エラー',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-002',
          priorityScore: 55,
          keyword: 'API レスポンス遅延',
          impactLevel: 'medium',
        },
        {
          issueId: 'issue-003',
          priorityScore: 25,
          keyword: 'ログ出力形式の改善',
          impactLevel: 'low',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-dept-chief-001',
    };

    const firstExecutionResult: ColorizedIssueList = prioritizeAndColorizeIssues(testInput);

    const secondExecutionResult: ColorizedIssueList = prioritizeAndColorizeIssues(testInput);

    expect(firstExecutionResult.colorizedIssues).toEqual(
      secondExecutionResult.colorizedIssues
    );
    expect(firstExecutionResult.colorDistribution).toEqual(
      secondExecutionResult.colorDistribution
    );
    expect(firstExecutionResult.colorizedIssues.length).toBe(3);
    expect(firstExecutionResult.colorizedIssues[0].issueId).toBe('issue-001');
    expect(firstExecutionResult.colorizedIssues[0].highlightColor).toBe('red');
    expect(firstExecutionResult.colorizedIssues[1].issueId).toBe('issue-002');
    expect(firstExecutionResult.colorizedIssues[1].highlightColor).toBe('yellow');
    expect(firstExecutionResult.colorizedIssues[2].issueId).toBe('issue-003');
    expect(firstExecutionResult.colorizedIssues[2].highlightColor).toBe('green');
    expect(firstExecutionResult.colorDistribution.red).toBe(1);
    expect(firstExecutionResult.colorDistribution.yellow).toBe(1);
    expect(firstExecutionResult.colorDistribution.green).toBe(1);
  });
});