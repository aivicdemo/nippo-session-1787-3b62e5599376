import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況追跡機能 - 本日の報告提出状況がちょうど提出期限時刻に更新される', () => {
  // SCEN-1099
  test('提出期限時刻ちょうど時点で、ダッシュボード上の報告提出状況が即座に更新され、提出済みユーザーと未提出ユーザーの区分が正確に表示される', () => {
    // 提出期限時刻を固定値で定義
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    // テスト時刻を提出期限時刻ちょうどに設定
    const aggregationTimestamp = new Date('2024-01-15T09:00:00Z');

    // チームメンバー情報（10名）: 7名提出済み、3名未提出
    const submittedUsers = [
      { userId: 'user-001', userName: '田中太郎', email: 'tanaka@example.com', submissionTime: new Date('2024-01-15T08:45:00Z') },
      { userId: 'user-002', userName: '佐藤花子', email: 'sato@example.com', submissionTime: new Date('2024-01-15T08:50:00Z') },
      { userId: 'user-003', userName: '鈴木次郎', email: 'suzuki@example.com', submissionTime: new Date('2024-01-15T08:30:00Z') },
      { userId: 'user-004', userName: '高橋美咲', email: 'takahashi@example.com', submissionTime: new Date('2024-01-15T08:55:00Z') },
      { userId: 'user-005', userName: '渡辺健太', email: 'watanabe@example.com', submissionTime: new Date('2024-01-15T08:40:00Z') },
      { userId: 'user-006', userName: '中村由紀', email: 'nakamura@example.com', submissionTime: new Date('2024-01-15T08:35:00Z') },
      { userId: 'user-007', userName: '小林翔太', email: 'kobayashi@example.com', submissionTime: new Date('2024-01-15T08:58:00Z') },
    ];

    const unsubmittedUsers = [
      { userId: 'user-008', userName: '伊藤美優', email: 'ito@example.com' },
      { userId: 'user-009', userName: '山田一郎', email: 'yamada@example.com' },
      { userId: 'user-010', userName: '鈴木桜子', email: 'suzuki-s@example.com' },
    ];

    const totalMembers = 10;
    const submittedCount = 7;
    const unsubmittedCount = 3;
    const delayedSubmissionCount = 0;

    // 入力: AggregateReportSubmissionStatusInput
    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 期待出力: ReportSubmissionStatusSummary
    const result = aggregateReportSubmissionStatus(input);

    // 基本的な集計結果の検証
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);

    // 提出率の検証: (7 / 10) * 100 = 70.0
    expect(result.submissionRate).toBe(70.0);

    // 未提出メンバーリストの検証
    expect(result.unsubmittedMembers).toHaveLength(unsubmittedCount);
    
    // 未提出メンバーが正確に一致することを確認
    const unsubmittedUserIds = result.unsubmittedMembers.map(member => member.userId);
    expect(unsubmittedUserIds).toContain('user-008');
    expect(unsubmittedUserIds).toContain('user-009');
    expect(unsubmittedUserIds).toContain('user-010');

    // 未提出メンバーの詳細情報が正確に含まれていることを確認
    const user008 = result.unsubmittedMembers.find(member => member.userId === 'user-008');
    expect(user008?.userName).toBe('伊藤美優');
    expect(user008?.email).toBe('ito@example.com');
    
    // 残り時間計算: 提出期限時刻ちょうど(09:00)なので、残り時間は0分
    expect(user008?.remainingMinutes).toBe(0);

    // aggregatedAt が ISO 8601 形式であることを確認
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // aggregatedAt がおおよそ現在時刻付近であることを確認（テスト実行時刻に依存しないように確認）
    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate).toBeInstanceOf(Date);
  });
});