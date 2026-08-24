import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - 課題の優先度色分け表示機能', () => {
  // SCEN-655
  test('課題が0件の場合、色分けルールが適用されない空の一覧が返される', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toEqual([]);
    expect(result.colorizedIssues.length).toBe(0);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe('string');
  });
});