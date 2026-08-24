import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー判定機能', () => {
  // SCEN-2806: [normal] 未提出メンバー判定機能 - 報告期限までに提出されていないメンバーが0件のとき、空リストが返される
  test('報告期限までに全員が提出済みの場合、未提出メンバーリストが空配列で返される', () => {
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const teamId = 'team-001';
    const executorUserId = 'user-admin-001';

    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const result: DetectUnsubmittedMembersOutput = detectAndNotifyUnsubmittedMembers(input);

    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers.length).toBe(0);
  });
});