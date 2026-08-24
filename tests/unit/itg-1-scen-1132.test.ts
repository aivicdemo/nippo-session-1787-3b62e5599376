import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  // SCEN-1132: [normal] 課題の色分け分類機能 - 中程度優先度課題が標準色として分類される
  test('中程度優先度と分類された課題に対して標準色（黄色）が割り当てられる', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 55,
          keyword: '既存機能のリファクタリング',
          impactLevel: 'medium',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-dept-head-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(55);
    expect(result.colorizedIssues[0].keyword).toBe('既存機能のリファクタリング');
    expect(result.colorizedIssues[0].colorCode).toBe('#FFFF00');
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);
    expect(typeof result.processedAt).toBe('string');
    expect(new Date(result.processedAt).getTime()).toBeGreaterThan(0);
  });
});