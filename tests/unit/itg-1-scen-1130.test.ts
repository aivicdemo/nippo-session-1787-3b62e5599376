import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコアに基づく課題の色分け分類機能', () => {
  // SCEN-1130: [normal] 課題の色分け分類機能 - 優先度スコア範囲に基づいて課題が正しい色分けカテゴリに割り当てられる
  test('優先度スコア範囲に基づいて課題が正しい色分けカテゴリに割り当てられる', () => {
    const issues = [
      {
        issueId: '1',
        keyword: 'バグ報告',
        priorityScore: 15,
        frequency: 1,
        impactScore: 15,
      },
      {
        issueId: '2',
        keyword: '機能改善',
        priorityScore: 50,
        frequency: 2,
        impactScore: 50,
      },
      {
        issueId: '3',
        keyword: 'システム停止',
        priorityScore: 85,
        frequency: 5,
        impactScore: 85,
      },
    ];

    const colorThresholds = {
      redThresholdMin: 71,
      yellowThresholdMin: 31,
    };

    const result = prioritizeAndColorizeIssues(
      {
        issues,
        colorThresholds,
        requestedBy: 'user-001',
      }
    );

    expect(result.colorizedIssues).toHaveLength(3);

    expect(result.colorizedIssues[0].issueId).toBe('1');
    expect(result.colorizedIssues[0].keyword).toBe('バグ報告');
    expect(result.colorizedIssues[0].priorityScore).toBe(15);
    expect(result.colorizedIssues[0].highlightColor).toBe('green');

    expect(result.colorizedIssues[1].issueId).toBe('2');
    expect(result.colorizedIssues[1].keyword).toBe('機能改善');
    expect(result.colorizedIssues[1].priorityScore).toBe(50);
    expect(result.colorizedIssues[1].highlightColor).toBe('yellow');

    expect(result.colorizedIssues[2].issueId).toBe('3');
    expect(result.colorizedIssues[2].keyword).toBe('システム停止');
    expect(result.colorizedIssues[2].priorityScore).toBe(85);
    expect(result.colorizedIssues[2].highlightColor).toBe('red');

    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});