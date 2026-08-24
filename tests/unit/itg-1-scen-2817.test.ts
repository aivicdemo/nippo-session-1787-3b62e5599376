import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバーの検出と通知', () => {
  // SCEN-2817
  test('報告期限がnullのとき、ValidationErrorが発生する', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-admin-001',
      reportDeadline: null as any,
    };

    expect(() => detectAndNotifyUnsubmittedMembers(input)).toThrow(/報告期限/);
  });
});