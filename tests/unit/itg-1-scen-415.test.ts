import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム集計機能', () => {
  test('SCEN-415: チームメンバー一覧が空配列のとき未提出メンバーを集計してエラーにならない', () => {
    // 前提条件: チームメンバー一覧が空の状態
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    // 実行: 未提出メンバーが存在しない状態で集計を実行
    const result = aggregateReportSubmissionStatus(input);

    // 期待結果: 関数は正常に実行され、未提出メンバーが空配列で返される
    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(0);
    expect(result.submittedCount).toBe(0);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(0);
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers.length).toBe(0);
    expect(result.aggregatedAt).toBeDefined();
    // aggregatedAt は ISO 8601 形式の文字列であることを確認
    expect(typeof result.aggregatedAt).toBe('string');
  });
});