import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 報告提出状況リアルタイム表示', () => {
  // SCEN-2825
  test('未提出メンバーユーザー名が空文字列のとき、ValidationErrorが発生する', () => {
    const input = {
      teamId: 'TEAM-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'USER-DIRECTOR-001',
      unsubmittedMembers: [
        {
          userId: 'M001',
          userName: '',
          email: 'member001@example.com',
          remainingMinutes: -15,
        },
      ],
    };

    expect(() => detectAndNotifyUnsubmittedMembers(input)).toThrow(/ユーザー名が未設定/);
  });
});