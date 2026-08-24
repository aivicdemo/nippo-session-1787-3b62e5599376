import { describe, test, expect } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー優先度リスト取得 - 手動実行フラグの型検証', () => {
  test('SCEN-2827: 手動実行フラグが boolean 以外のとき、エラーが発生する', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-admin-001';

    const invalidFlags = [
      'true',
      1,
      0,
      null,
      {},
      [],
      undefined,
      Symbol('test'),
    ];

    invalidFlags.forEach((invalidFlag) => {
      expect(() => {
        detectAndNotifyUnsubmittedMembers(
          {
            teamId,
            reportDate,
            morningMeetingStartTime,
            executorUserId,
          },
          {
            manualExecutionFlag: invalidFlag as any,
          }
        );
      }).toThrow(/manualExecutionFlag|boolean/i);
    });
  });
});