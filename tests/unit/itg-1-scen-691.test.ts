import { prioritizeAndColorizeIssues, type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization: prioritizeAndColorizeIssues', () => {
  // SCEN-691: [edge] 課題優先度色分け機能 - 複数課題が同一優先度スコアで並ぶ場合すべてが同色で色分けされる
  test('複数の課題が同一優先度スコアを持つ場合、すべてに同一の色コードが割り当てられる', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 65,
          keyword: 'API応答遅延',
          impactLevel: 'medium'
        },
        {
          issueId: 'issue-002',
          priorityScore: 65,
          keyword: 'キャッシュ不整合',
          impactLevel: 'medium'
        },
        {
          issueId: 'issue-003',
          priorityScore: 65,
          keyword: 'ロードバランシング障害',
          impactLevel: 'medium'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-dept-head-001'
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);
    
    const color1 = result.colorizedIssues[0].highlightColor;
    const color2 = result.colorizedIssues[1].highlightColor;
    const color3 = result.colorizedIssues[2].highlightColor;

    expect(color1).toBe(color2);
    expect(color2).toBe(color3);
    expect(color1).toBe('yellow');

    expect(result.colorDistribution).toEqual({
      red: 0,
      yellow: 3,
      green: 0
    });

    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe('string');
  });
});