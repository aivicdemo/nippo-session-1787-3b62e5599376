import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度色分け表示機能', () => {
  test('SCEN-666: 課題IDが空文字列のときエラーが発生する', () => {
    const input = {
      issues: [
        {
          issueId: '',
          priorityScore: 75,
          keyword: 'データベース接続エラー',
          impactLevel: 'high',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-123',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/課題ID/);
  });
});