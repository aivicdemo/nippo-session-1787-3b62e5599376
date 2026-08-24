import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示', () => {
  // SCEN-2959: [normal] ダッシュボード色分け表示機能 - 優先度スコア50以上80未満の課題は黄色でハイライトされる
  test('優先度スコア50以上80未満の課題は黄色でハイライトされ、それ以外は異なる色で表示される', () => {
    // テストデータ：優先度スコア50、60、79の課題を準備
    const testIssues = [
      {
        issueId: 'issue-001',
        priorityScore: 50,
        keyword: 'Database Performance',
        impactLevel: 'high'
      },
      {
        issueId: 'issue-002',
        priorityScore: 60,
        keyword: 'API Response Time',
        impactLevel: 'high'
      },
      {
        issueId: 'issue-003',
        priorityScore: 79,
        keyword: 'Memory Leak',
        impactLevel: 'medium'
      },
      {
        issueId: 'issue-004',
        priorityScore: 49,
        keyword: 'Minor Bug',
        impactLevel: 'low'
      },
      {
        issueId: 'issue-005',
        priorityScore: 80,
        keyword: 'Critical Outage',
        impactLevel: 'high'
      }
    ];

    const colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 50
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: testIssues,
      colorThresholds: colorThresholds,
      requestedBy: 'user-dept-head-001'
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 優先度スコア50以上80未満の課題が黄色でハイライトされていることを確認
    const issue001 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(issue001?.highlightColor).toBe('yellow');
    expect(issue001?.issueId).toBe('issue-001');

    const issue002 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(issue002?.highlightColor).toBe('yellow');
    expect(issue002?.issueId).toBe('issue-002');

    const issue003 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-003'
    );
    expect(issue003?.highlightColor).toBe('yellow');
    expect(issue003?.issueId).toBe('issue-003');

    // スコア49以下の課題は黄色以外で表示されることを確認
    const issue004 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-004'
    );
    expect(issue004?.highlightColor).toBe('green');
    expect(issue004?.issueId).toBe('issue-004');

    // スコア80以上の課題は赤で表示されることを確認
    const issue005 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-005'
    );
    expect(issue005?.highlightColor).toBe('red');
    expect(issue005?.issueId).toBe('issue-005');

    // 色分け分布を確認：黄色が3件、緑が1件、赤が1件
    expect(result.colorDistribution.yellow).toBe(3);
    expect(result.colorDistribution.green).toBe(1);
    expect(result.colorDistribution.red).toBe(1);

    // 処理実行日時が記録されていることを確認
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});