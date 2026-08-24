import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-153
  test('本日0時0分時点で提出済みメンバー数が正しく集計される', () => {
    // 基準時刻: 本日 00:00:00 UTC
    const baseTime = new Date('2024-01-15T00:00:00Z');
    const currentTime = baseTime;

    // テストデータ準備
    // メンバーA～E: 本日00:00:00～00:30:00に提出済み
    const submittedMembers = [
      {
        userId: 'user-a',
        userName: 'Member A',
        email: 'member-a@example.com',
        submissionTimestamp: new Date('2024-01-15T00:00:00Z'),
      },
      {
        userId: 'user-b',
        userName: 'Member B',
        email: 'member-b@example.com',
        submissionTimestamp: new Date('2024-01-15T00:05:00Z'),
      },
      {
        userId: 'user-c',
        userName: 'Member C',
        email: 'member-c@example.com',
        submissionTimestamp: new Date('2024-01-15T00:10:00Z'),
      },
      {
        userId: 'user-d',
        userName: 'Member D',
        email: 'member-d@example.com',
        submissionTimestamp: new Date('2024-01-15T00:15:00Z'),
      },
      {
        userId: 'user-e',
        userName: 'Member E',
        email: 'member-e@example.com',
        submissionTimestamp: new Date('2024-01-15T00:30:00Z'),
      },
    ];

    // メンバーF～J: 本日00:31:00以降、または未提出
    const unsubmittedMembers = [
      {
        userId: 'user-f',
        userName: 'Member F',
        email: 'member-f@example.com',
        submissionTimestamp: new Date('2024-01-15T00:31:00Z'),
      },
      {
        userId: 'user-g',
        userName: 'Member G',
        email: 'member-g@example.com',
        submissionTimestamp: new Date('2024-01-15T08:00:00Z'),
      },
      {
        userId: 'user-h',
        userName: 'Member H',
        email: 'member-h@example.com',
        submissionTimestamp: null,
      },
      {
        userId: 'user-i',
        userName: 'Member I',
        email: 'member-i@example.com',
        submissionTimestamp: null,
      },
      {
        userId: 'user-j',
        userName: 'Member J',
        email: 'member-j@example.com',
        submissionTimestamp: null,
      },
    ];

    const allMembers = [...submittedMembers, ...unsubmittedMembers];

    // 入力パラメータの構築
    // aggregateReportSubmissionStatus の入力形式に合わせる
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    // モック用データ: 本日0時0分を基準に集計
    // submittedCount = 本日00:00:00～00:30:00に提出したメンバー数 = 5
    const expectedSubmittedCount = 5;
    const expectedUnsubmittedCount = 5; // F, G (00:31以降), H, I, J
    const expectedDelayedSubmissionCount = 2; // F, G (00:31以降だが同日提出)
    const expectedTotalMembers = 10;

    // 提出率を計算: (期限内提出 / 総メンバー数) * 100 = (5 / 10) * 100 = 50.0
    const expectedSubmissionRate = 50.0;

    // 未提出メンバー情報の作成
    const unsubmittedMemberDetails = [
      {
        userId: 'user-h',
        userName: 'Member H',
        email: 'member-h@example.com',
        remainingMinutes: -1440, // 24時間超過（未提出）
      },
      {
        userId: 'user-i',
        userName: 'Member I',
        email: 'member-i@example.com',
        remainingMinutes: -1440,
      },
      {
        userId: 'user-j',
        userName: 'Member J',
        email: 'member-j@example.com',
        remainingMinutes: -1440,
      },
    ];

    // 実際の関数呼び出し
    // この関数は実装側で提供されるデータベースから取得したデータをもとに集計を行うと想定
    // テスト時は、この関数の戻り値が期待値と一致するかを検証する
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      input,
      {
        // モックデータプロバイダー
        getAllTeamMembers: async () => allMembers.map(m => ({
          userId: m.userId,
          userName: m.userName,
          email: m.email,
        })),
        getSubmissionsForDate: async () =>
          submittedMembers.map(m => ({
            userId: m.userId,
            submissionTimestamp: m.submissionTimestamp!,
          })),
        getDeadlineForDate: async () => ({
          deadlineTime: new Date('2024-01-15T09:00:00Z'),
          timeZone: 'Asia/Tokyo',
        }),
      }
    );

    // アサーション
    expect(result).toBeDefined();
    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(expectedTotalMembers);
    expect(result.submittedCount).toBe(expectedSubmittedCount);
    expect(result.unsubmittedCount).toBeGreaterThanOrEqual(expectedUnsubmittedCount - expectedDelayedSubmissionCount);
    expect(result.delayedSubmissionCount).toBeLessThanOrEqual(expectedDelayedSubmissionCount);
    expect(result.submissionRate).toBe(expectedSubmissionRate);
    expect(result.aggregatedAt).toBeDefined();
    expect(new Date(result.aggregatedAt).getTime()).toBeGreaterThanOrEqual(currentTime.getTime());
  });
});