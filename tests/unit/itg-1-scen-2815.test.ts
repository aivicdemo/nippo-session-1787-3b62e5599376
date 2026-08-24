import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('detectAndNotifyUnsubmittedMembers - 未提出メンバー検出と通知', () => {
  // SCEN-2815
  test('報告提出状況データが空のとき、エラーが発生する', async () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-director-001',
    };

    await expect(
      detectAndNotifyUnsubmittedMembers(input)
    ).rejects.toThrow(/報告提出状況データ/);
  });
});