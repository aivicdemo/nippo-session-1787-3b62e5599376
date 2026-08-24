import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況の集計機能', () => {
  test('SCEN-395: 本日の報告が0件の場合、提出済み件数0・未提出件数0として集計される', () => {
    // 入力: 集計対象日付を本日（2024-01-15）で指定、対象チームは存在するが報告レコードは0件
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-admin-001',
      includeDelayedSubmissions: true,
    };

    // 実行
    const result = aggregateReportSubmissionStatus(input);

    // 期待結果: 提出済み件数0、未提出件数0、提出率0.0、集計データは正常に返される
    expect(result.submittedCount).toBe(0);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.totalMembers).toBe(0);
    expect(result.submissionRate).toBe(0.0);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.aggregatedAt).toBeDefined();
  });
});