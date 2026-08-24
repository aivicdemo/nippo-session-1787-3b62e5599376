import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-3028
  test('同じ日付の提出状況データを複数回参照しても同じ結果が返される', () => {
    const reportDate = '2026-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    // 提出済みユーザー: A, C, E, G, I
    const submittedUsers = [
      {
        userId: 'user-a',
        userName: 'ユーザーA',
        email: 'user-a@example.com',
        submittedAt: new Date('2026-01-15T08:30:00Z'),
      },
      {
        userId: 'user-c',
        userName: 'ユーザーC',
        email: 'user-c@example.com',
        submittedAt: new Date('2026-01-15T08:35:00Z'),
      },
      {
        userId: 'user-e',
        userName: 'ユーザーE',
        email: 'user-e@example.com',
        submittedAt: new Date('2026-01-15T08:40:00Z'),
      },
      {
        userId: 'user-g',
        userName: 'ユーザーG',
        email: 'user-g@example.com',
        submittedAt: new Date('2026-01-15T08:45:00Z'),
      },
      {
        userId: 'user-i',
        userName: 'ユーザーI',
        email: 'user-i@example.com',
        submittedAt: new Date('2026-01-15T08:50:00Z'),
      },
    ];

    // 未提出ユーザー: B, D, F, H, J
    const unsubmittedUsers = [
      {
        userId: 'user-b',
        userName: 'ユーザーB',
        email: 'user-b@example.com',
      },
      {
        userId: 'user-d',
        userName: 'ユーザーD',
        email: 'user-d@example.com',
      },
      {
        userId: 'user-f',
        userName: 'ユーザーF',
        email: 'user-f@example.com',
      },
      {
        userId: 'user-h',
        userName: 'ユーザーH',
        email: 'user-h@example.com',
      },
      {
        userId: 'user-j',
        userName: 'ユーザーJ',
        email: 'user-j@example.com',
      },
    ];

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 第1回目呼び出し
    const response1 = aggregateReportSubmissionStatus(input);

    // 第2回目呼び出し
    const response2 = aggregateReportSubmissionStatus(input);

    // 第3回目呼び出し
    const response3 = aggregateReportSubmissionStatus(input);

    // 提出済みユーザーが5名
    expect(response1.submittedCount).toBe(5);
    expect(response2.submittedCount).toBe(5);
    expect(response3.submittedCount).toBe(5);

    // 未提出ユーザーが5名
    expect(response1.unsubmittedCount).toBe(5);
    expect(response2.unsubmittedCount).toBe(5);
    expect(response3.unsubmittedCount).toBe(5);

    // チーム総メンバー数が10名
    expect(response1.totalMembers).toBe(10);
    expect(response2.totalMembers).toBe(10);
    expect(response3.totalMembers).toBe(10);

    // 提出率が50.0%
    expect(response1.submissionRate).toBe(50.0);
    expect(response2.submissionRate).toBe(50.0);
    expect(response3.submissionRate).toBe(50.0);

    // 期限超過提出が0名
    expect(response1.delayedSubmissionCount).toBe(0);
    expect(response2.delayedSubmissionCount).toBe(0);
    expect(response3.delayedSubmissionCount).toBe(0);

    // 集計対象チームID
    expect(response1.teamId).toBe(teamId);
    expect(response2.teamId).toBe(teamId);
    expect(response3.teamId).toBe(teamId);

    // 集計対象報告日
    expect(response1.reportDate).toBe(reportDate);
    expect(response2.reportDate).toBe(reportDate);
    expect(response3.reportDate).toBe(reportDate);

    // 未提出メンバー一覧が同じ
    expect(response1.unsubmittedMembers).toEqual(response2.unsubmittedMembers);
    expect(response2.unsubmittedMembers).toEqual(response3.unsubmittedMembers);

    // 未提出メンバー一覧の内容確認: B, D, F, H, J
    const unsubmittedMemberIds1 = response1.unsubmittedMembers.map((m) => m.userId).sort();
    const unsubmittedMemberIds2 = response2.unsubmittedMembers.map((m) => m.userId).sort();
    const unsubmittedMemberIds3 = response3.unsubmittedMembers.map((m) => m.userId).sort();

    expect(unsubmittedMemberIds1).toEqual(['user-b', 'user-d', 'user-f', 'user-h', 'user-j']);
    expect(unsubmittedMemberIds2).toEqual(['user-b', 'user-d', 'user-f', 'user-h', 'user-j']);
    expect(unsubmittedMemberIds3).toEqual(['user-b', 'user-d', 'user-f', 'user-h', 'user-j']);

    // 集計実行時刻が ISO 8601 形式で記録されている
    expect(response1.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(response2.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(response3.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // 3回の呼び出しで返されたレスポンスの内容が完全に一致する
    expect(response1).toEqual(response2);
    expect(response2).toEqual(response3);
  });
});