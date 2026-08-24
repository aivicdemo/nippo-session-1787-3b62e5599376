import { aggregateReportSubmissionStatus, type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 報告提出状況リアルタイム表示機能', () => {
  // SCEN-1024
  test('ダッシュボードに1人のメンバーの報告提出状況がリアルタイム表示される', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';
    
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    // チーム情報の検証
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // チーム総メンバー数は10名
    expect(result.totalMembers).toBe(10);

    // 1人が期限内に提出済み
    expect(result.submittedCount).toBe(1);

    // 9名が未提出
    expect(result.unsubmittedCount).toBe(9);

    // 期限超過提出は0名
    expect(result.delayedSubmissionCount).toBe(0);

    // 提出率: (1 / 10) * 100 = 10.0%
    expect(result.submissionRate).toBe(10.0);

    // 未提出メンバーリストは9名
    expect(result.unsubmittedMembers).toHaveLength(9);

    // 未提出メンバーの情報構造を検証（最初の1名を例として）
    const firstUnsubmitted = result.unsubmittedMembers[0];
    expect(firstUnsubmitted).toHaveProperty('userId');
    expect(firstUnsubmitted).toHaveProperty('userName');
    expect(firstUnsubmitted).toHaveProperty('email');
    expect(firstUnsubmitted).toHaveProperty('remainingMinutes');

    // 集計実行時刻がISO 8601形式で記録されている
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // 集計時刻は現在の時刻付近（許容範囲: 5秒以内）
    const aggregatedTime = new Date(result.aggregatedAt);
    const now = new Date();
    const timeDiffSeconds = Math.abs((now.getTime() - aggregatedTime.getTime()) / 1000);
    expect(timeDiffSeconds).toBeLessThan(5);
  });
});