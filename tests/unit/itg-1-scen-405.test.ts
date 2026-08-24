import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー一覧の生成機能 - 冪等性', () => {
  // SCEN-405
  it('同じ入力で未提出メンバー一覧を2回生成した場合、同じ一覧が返される', async () => {
    const teamId = 'TEAM-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'EXEC-001';

    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    // 1回目の呼び出し
    const firstResult: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(input);

    // 2回目の呼び出し
    const secondResult: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(input);

    // 未提出メンバー一覧の要素数が同じであることを確認
    expect(firstResult.unsubmittedMembers.length).toBe(secondResult.unsubmittedMembers.length);

    // 各メンバーの要素数が5名であることを確認
    expect(firstResult.unsubmittedMembers.length).toBe(5);
    expect(secondResult.unsubmittedMembers.length).toBe(5);

    // 各メンバーについて、属性値が完全に一致することを確認
    for (let i = 0; i < firstResult.unsubmittedMembers.length; i++) {
      const firstMember = firstResult.unsubmittedMembers[i];
      const secondMember = secondResult.unsubmittedMembers[i];

      expect(firstMember.userId).toBe(secondMember.userId);
      expect(firstMember.userName).toBe(secondMember.userName);
      expect(firstMember.email).toBe(secondMember.email);
      expect(firstMember.remainingMinutes).toBe(secondMember.remainingMinutes);
    }

    // 1回目と2回目の送信通知件数が一致することを確認
    expect(firstResult.notificationsSent).toBe(secondResult.notificationsSent);

    // 通知失敗件数が一致することを確認
    expect(firstResult.notificationFailures.length).toBe(secondResult.notificationFailures.length);

    // 実行日時の形式は異なる可能性があるため、ISO8601形式であることのみ確認
    expect(firstResult.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(secondResult.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});