import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況追跡機能', () => {
  // SCEN-1105: [edge] 報告提出状況追跡機能 - 未提出メンバー一覧の順序が逆の場合、正しい昇順に並び替えられる
  test('未提出メンバー一覧が逆順で入力された場合、昇順に並び替えられること', () => {
    const reversedMembersData = [
      { userId: 'member_10', userName: 'ユーザー10', email: 'user10@example.com', remainingMinutes: -5 },
      { userId: 'member_09', userName: 'ユーザー9', email: 'user9@example.com', remainingMinutes: -4 },
      { userId: 'member_08', userName: 'ユーザー8', email: 'user8@example.com', remainingMinutes: -3 },
      { userId: 'member_07', userName: 'ユーザー7', email: 'user7@example.com', remainingMinutes: -2 },
      { userId: 'member_06', userName: 'ユーザー6', email: 'user6@example.com', remainingMinutes: -1 },
      { userId: 'member_05', userName: 'ユーザー5', email: 'user5@example.com', remainingMinutes: 0 },
      { userId: 'member_04', userName: 'ユーザー4', email: 'user4@example.com', remainingMinutes: 1 },
      { userId: 'member_03', userName: 'ユーザー3', email: 'user3@example.com', remainingMinutes: 2 },
      { userId: 'member_02', userName: 'ユーザー2', email: 'user2@example.com', remainingMinutes: 3 },
      { userId: 'member_01', userName: 'ユーザー1', email: 'user1@example.com', remainingMinutes: 4 },
    ];

    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(
      input,
      reversedMembersData,
    );

    // 総メンバー数は10人
    expect(result.totalMembers).toBe(10);

    // 未提出メンバーが正確に10人
    expect(result.unsubmittedMembers).toHaveLength(10);

    // 未提出メンバーが昇順で並んでいること
    expect(result.unsubmittedMembers[0].userId).toBe('member_01');
    expect(result.unsubmittedMembers[1].userId).toBe('member_02');
    expect(result.unsubmittedMembers[2].userId).toBe('member_03');
    expect(result.unsubmittedMembers[3].userId).toBe('member_04');
    expect(result.unsubmittedMembers[4].userId).toBe('member_05');
    expect(result.unsubmittedMembers[5].userId).toBe('member_06');
    expect(result.unsubmittedMembers[6].userId).toBe('member_07');
    expect(result.unsubmittedMembers[7].userId).toBe('member_08');
    expect(result.unsubmittedMembers[8].userId).toBe('member_09');
    expect(result.unsubmittedMembers[9].userId).toBe('member_10');

    // メンバーの重複や欠落がないこと
    const userIds = result.unsubmittedMembers.map(m => m.userId);
    const uniqueUserIds = new Set(userIds);
    expect(uniqueUserIds.size).toBe(10);

    // 各メンバーのデータが正確に保持されていること
    expect(result.unsubmittedMembers[0]).toEqual({
      userId: 'member_01',
      userName: 'ユーザー1',
      email: 'user1@example.com',
      remainingMinutes: 4,
    });

    expect(result.unsubmittedMembers[9]).toEqual({
      userId: 'member_10',
      userName: 'ユーザー10',
      email: 'user10@example.com',
      remainingMinutes: -5,
    });
  });
});