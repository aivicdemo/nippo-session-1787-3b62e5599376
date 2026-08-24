import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー一覧の生成機能', () => {
  // SCEN-402: [normal] 未提出メンバー一覧の生成機能 - 未提出メンバーが0人の場合、空の一覧が返される
  test('全メンバーが報告提出済みの場合、未提出メンバー一覧が空の配列として返される', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-admin-001'
    };

    const result = detectAndNotifyUnsubmittedMembers(input);

    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.notificationsSent).toBe(0);
    expect(result.notificationFailures).toEqual([]);
    expect(typeof result.executedAt).toBe('string');
  });
});