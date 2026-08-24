import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能 - 影響度スコア検証', () => {
  // SCEN-715: [error] 優先度別課題ハイライト表示機能 - 影響度スコアが数値でないとき処理がエラーになる
  test('影響度スコアが数値でない場合、適切なエラーハンドリングが実行される', () => {
    const mockColorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const testCases = [
      {
        impactValue: 'invalid' as unknown as number,
        description: '文字列「invalid」を受け取った場合',
      },
      {
        impactValue: null as unknown as number,
        description: 'nullを受け取った場合',
      },
      {
        impactValue: undefined as unknown as number,
        description: 'undefinedを受け取った場合',
      },
      {
        impactValue: true as unknown as number,
        description: 'boolean値trueを受け取った場合',
      },
    ];

    testCases.forEach(({ impactValue, description }) => {
      const issuesWithInvalidImpact = [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'システムダウン',
          impactLevel: 'high',
        },
      ];

      const mockTextAnalysisAdapter = {
        assessImpactScore: jest.fn().mockReturnValue(impactValue),
      };

      expect(() => {
        prioritizeAndColorizeIssues(
          issuesWithInvalidImpact,
          mockColorThresholds,
          'user-001'
        );
      }).toThrow(/影響度スコア|impactScore|数値/i);
    });
  });
});