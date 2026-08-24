import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度色分け表示機能', () => {
  // SCEN-667: [error] 課題優先度色分け表示機能 - 課題リストが null のとき色分けルール適用がスキップされエラーになる
  test('should handle null issues array and skip colorization with appropriate error handling', () => {
    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };
    const requestedBy = 'user-001';

    // 課題リストが null の場合、TypeError が発生することを検証
    expect(() => {
      prioritizeAndColorizeIssues(
        null as any,
        colorThresholds,
        requestedBy
      );
    }).toThrow(/null|undefined|issues/i);
  });
});