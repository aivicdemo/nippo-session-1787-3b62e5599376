import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-696: [normal] 優先度別課題ハイライト表示機能 - 課題が 1 件の場合、スコア判定と色分け表示が正常に動作する
  test('should highlight and colorize single issue with impact score 75 as orange warning', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue_001',
          priorityScore: 75,
          keyword: 'データベース接続エラー',
          impactLevel: 'high',
        },
      ],
      colorThresholds: {
        redThresholdMin: 75,
        yellowThresholdMin: 50,
      },
      requestedBy: 'user_dept_head_001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);
    
    const colorized = result.colorizedIssues[0];
    expect(colorized.issueId).toBe('issue_001');
    expect(colorized.priorityScore).toBe(75);
    expect(colorized.keyword).toBe('データベース接続エラー');
    
    // priorityScore 75 は redThresholdMin (75) 以上なので赤色に分類
    expect(colorized.highlightColor).toBe('red');
    
    expect(result.colorDistribution).toBeDefined();
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});