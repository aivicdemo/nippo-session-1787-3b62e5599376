import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 報告提出状況リアルタイム表示', () => {
  // SCEN-113
  test('9名が報告送信完了し1名が未送信の状態で、提出済み9名と未提出1名が正確に区分表示される', () => {
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'manager-001';

    // 10名のテストユーザーIDを定義
    const userIds = [
      'user1',
      'user2',
      'user3',
      'user4',
      'user5',
      'user6',
      'user7',
      'user8',
      'user9',
      'user10',
    ];

    // ユーザー情報マップ（ユーザー表示名とメールアドレス）
    const userInfoMap: Record<
      string,
      { userName: string; email: string }
    > = {
      user1: {
        userName: 'ユーザー1',
        email: 'user1@example.com',
      },
      user2: {
        userName: 'ユーザー2',
        email: 'user2@example.com',
      },
      user3: {
        userName: 'ユーザー3',
        email: 'user3@example.com',
      },
      user4: {
        userName: 'ユーザー4',
        email: 'user4@example.com',
      },
      user5: {
        userName: 'ユーザー5',
        email: 'user5@example.com',
      },
      user6: {
        userName: 'ユーザー6',
        email: 'user6@example.com',
      },
      user7: {
        userName: 'ユーザー7',
        email: 'user7@example.com',
      },
      user8: {
        userName: 'ユーザー8',
        email: 'user8@example.com',
      },
      user9: {
        userName: 'ユーザー9',
        email: 'user9@example.com',
      },
      user10: {
        userName: 'ユーザー10',
        email: 'user10@example.com',
      },
    };

    // 報告提出状況データを構築
    // user1～user9は期限内に提出済み、user10は未提出
    const submissionStatusData = userIds.map((userId) => ({
      userId,
      reportDate,
      isSubmitted: userId !== 'user10',
      submissionTime:
        userId !== 'user10'
          ? new Date('2024-01-15T08:30:00Z').toISOString()
          : null,
      isDelayedSubmission: false,
    }));

    // チームメンバー情報
    const teamMembers = userIds.map((userId) => ({
      userId,
      userName: userInfoMap[userId].userName,
      email: userInfoMap[userId].email,
    }));

    // aggregateReportSubmissionStatus関数を呼び出す
    const result = aggregateReportSubmissionStatus(
      {
        teamId,
        reportDate,
        requestUserId,
        includeDelayedSubmissions: true,
      },
      {
        getTeamMembers: async () => teamMembers,
        getSubmissionStatus: async () => submissionStatusData,
        getReportDeadline: async () => ({
          deadlineTime: new Date('2024-01-15T09:00:00Z'),
          timeZone: 'Asia/Tokyo',
        }),
      }
    );

    // 戻り値がPromiseであることを確認し、解決を待つ
    return result.then((summary) => {
      // teamId と reportDate が正確に反映されていることを確認
      expect(summary.teamId).toBe('team-001');
      expect(summary.reportDate).toBe('2024-01-15');

      // チーム総メンバー数が10であることを確認
      expect(summary.totalMembers).toBe(10);

      // 期限内提出済みメンバー数が9であることを確認
      expect(summary.submittedCount).toBe(9);

      // 未提出メンバー数が1であることを確認
      expect(summary.unsubmittedCount).toBe(1);

      // 期限超過提出メンバー数が0であることを確認
      expect(summary.delayedSubmissionCount).toBe(0);

      // 提出率が90.0%であることを確認（9 / 10 * 100 = 90.0）
      expect(summary.submissionRate).toBe(90.0);

      // 未提出メンバーのリストが1件であることを確認
      expect(summary.unsubmittedMembers).toHaveLength(1);

      // 未提出メンバーの詳細情報を確認
      const unsubmittedMember = summary.unsubmittedMembers[0];
      expect(unsubmittedMember.userId).toBe('user10');
      expect(unsubmittedMember.userName).toBe('ユーザー10');
      expect(unsubmittedMember.email).toBe('user10@example.com');

      // 残り時間は正の値（期限前）であることを確認
      // 期限 09:00:00 - 現在時刻の差分が正の値
      expect(unsubmittedMember.remainingMinutes).toBeGreaterThan(0);

      // aggregatedAtが ISO 8601形式の日時文字列であることを確認
      expect(summary.aggregatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
      );

      // submittedCount + unsubmittedCount + delayedSubmissionCount = totalMembers であることを確認
      expect(
        summary.submittedCount +
          summary.unsubmittedCount +
          summary.delayedSubmissionCount
      ).toBe(summary.totalMembers);
    });
  });
});