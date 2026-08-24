import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-718
  test('優先度スコアが0未満のとき処理がエラーになる', () => {
    const colorThresholdConfig: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: -1,
          keyword: 'デプロイ失敗',
          impactLevel: 'high',
        },
      ],
      colorThresholds: colorThresholdConfig,
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/優先度スコア/);
  });
});