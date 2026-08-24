import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('提出状況リアルタイム表示機能', () => {
  // SCEN-118: [edge] 提出状況リアルタイム表示機能 - 開発エンジニア10名の報告データを同時に受け取った場合、全員の情報が重複なく正確に表示される
  test('10名のメンバーが同時に報告を送信した場合、全員が重複なく表示される', async () => {
    // 準備: テスト用の入力データを構築
    // チームID、報告日、リクエストユーザーID、期限超過の提出を含めるかどうかを設定
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-manager-001';
    const includeDelayedSubmissions = true;

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions,
    };

    // 10名のメンバーの報告データを同時に受け取ったシミュレーション
    // 期限内提出: 8名
    // 期限超過提出: 2名
    // 未提出: 0名
    // チーム総メンバー数: 10名

    const expectedResult: ReportSubmissionStatusSummary = {
      teamId,
      reportDate,
      totalMembers: 10,
      submittedCount: 8,
      unsubmittedCount: 0,
      delayedSubmissionCount: 2,
      submissionRate: 100.0, // (8 + 2) / 10 * 100 = 100.0
      unsubmittedMembers: [],
      aggregatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/),
    };

    // 実行: 提出状況を集計
    const result = await aggregateReportSubmissionStatus(input);

    // 検証: 期待値と実際の結果が一致することを確認
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(8);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(2);
    expect(result.submissionRate).toBe(100.0);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.aggregatedAt).toBeTruthy();

    // 追加検証: aggregatedAtがISO 8601形式であることを確認
    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate.getTime()).toBeGreaterThan(0);
    expect(aggregatedAtDate.getTime()).toBeLessThanOrEqual(Date.now());
  });
});