import { aggregateReportSubmissionStatus, type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示', () => {
  // SCEN-088: [normal] 報告提出状況のリアルタイム集計・表示機能 - 朝会開始予定時刻の5分前に到達したとき提出済み・未提出の状況が部長ダッシュボードに表示される
  test('朝会開始予定時刻の5分前に提出済み・未提出メンバー状況をリアルタイム表示', () => {
    // テスト固定時刻: 朝会開始予定09:00の5分前 = 08:55
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    // 入力: 朝会開始予定時刻の5分前（08:55）のダッシュボード表示リクエスト
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 期待結果: 10名チーム中、提出済み7名、未提出3名の状況をリアルタイム集計
    const expectedOutput: ReportSubmissionStatusSummary = {
      teamId,
      reportDate,
      totalMembers: 10,
      submittedCount: 7,
      unsubmittedCount: 3,
      delayedSubmissionCount: 0,
      submissionRate: 70.0, // (7/10) * 100 = 70.0%
      unsubmittedMembers: [
        {
          userId: 'user-eng-004',
          userName: 'engineer-04',
          email: 'engineer-04@example.com',
          remainingMinutes: 5, // 08:55から09:00までの残り時間: 5分
        },
        {
          userId: 'user-eng-008',
          userName: 'engineer-08',
          email: 'engineer-08@example.com',
          remainingMinutes: 5,
        },
        {
          userId: 'user-eng-010',
          userName: 'engineer-10',
          email: 'engineer-10@example.com',
          remainingMinutes: 5,
        },
      ],
      aggregatedAt: '2024-01-15T08:55:00.000Z', // ISO 8601形式の集計実行時刻（固定）
    };

    // 実行
    const result = aggregateReportSubmissionStatus(input);

    // 検証: (1) 総員数が10名
    expect(result.totalMembers).toBe(10);

    // 検証: (2) 提出済み件数が7件
    expect(result.submittedCount).toBe(7);

    // 検証: (3) 未提出件数が3件
    expect(result.unsubmittedCount).toBe(3);

    // 検証: (4) 提出率が70.0%（小数第1位）
    expect(result.submissionRate).toBe(70.0);

    // 検証: (5) 未提出メンバーの一覧が正確に表示される
    expect(result.unsubmittedMembers).toHaveLength(3);
    expect(result.unsubmittedMembers[0]).toEqual({
      userId: 'user-eng-004',
      userName: 'engineer-04',
      email: 'engineer-04@example.com',
      remainingMinutes: 5,
    });
    expect(result.unsubmittedMembers[1]).toEqual({
      userId: 'user-eng-008',
      userName: 'engineer-08',
      email: 'engineer-08@example.com',
      remainingMinutes: 5,
    });
    expect(result.unsubmittedMembers[2]).toEqual({
      userId: 'user-eng-010',
      userName: 'engineer-10',
      email: 'engineer-10@example.com',
      remainingMinutes: 5,
    });

    // 検証: (6) 集計時刻がISO 8601形式で記録されている
    expect(result.aggregatedAt).toBe('2024-01-15T08:55:00.000Z');

    // 検証: (7) チームIDと報告日が集計結果に反映されている
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // 検証: (8) 期限超過提出件数が0件（朝会開始予定時刻前のため）
    expect(result.delayedSubmissionCount).toBe(0);

    // 検証: (9) 全体の集計結果が期待値と一致
    expect(result).toEqual(expectedOutput);
  });
});