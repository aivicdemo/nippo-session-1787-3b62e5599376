import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー優先度判定機能', () => {
  // SCEN-2833: [edge] 未提出メンバー優先度判定機能 - 同じ優先度スコアを持つ複数の未提出メンバーが重複なく順序一定で表示される
  test('同じ優先度スコアを持つ複数の未提出メンバーが一定の順序で返却され、重複がないこと', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const executorUserId = 'user-manager-001';
    const morningMeetingStartTime = '09:00';

    const unsubmittedMember1 = {
      userId: 'user-member-001',
      userName: 'メンバーA',
      email: 'member-a@example.com',
      remainingMinutes: -15,
      priorityScore: 75,
      recordId: 'record-001',
      submissionTimestamp: null,
    };

    const unsubmittedMember2 = {
      userId: 'user-member-004',
      userName: 'メンバーD',
      email: 'member-d@example.com',
      remainingMinutes: -15,
      priorityScore: 75,
      recordId: 'record-004',
      submissionTimestamp: null,
    };

    const unsubmittedMember3 = {
      userId: 'user-member-002',
      userName: 'メンバーB',
      email: 'member-b@example.com',
      remainingMinutes: -15,
      priorityScore: 75,
      recordId: 'record-002',
      submissionTimestamp: null,
    };

    const unsubmittedMember4 = {
      userId: 'user-member-005',
      userName: 'メンバーE',
      email: 'member-e@example.com',
      remainingMinutes: -15,
      priorityScore: 75,
      recordId: 'record-005',
      submissionTimestamp: null,
    };

    const unsubmittedMember5 = {
      userId: 'user-member-003',
      userName: 'メンバーC',
      email: 'member-c@example.com',
      remainingMinutes: -15,
      priorityScore: 75,
      recordId: 'record-003',
      submissionTimestamp: null,
    };

    const testInput = {
      teamId: teamId,
      reportDate: reportDate,
      morningMeetingStartTime: morningMeetingStartTime,
      executorUserId: executorUserId,
    };

    const firstExecutionResult = await detectAndNotifyUnsubmittedMembers(testInput);
    const firstOrderedUserIds = firstExecutionResult.unsubmittedMembers.map(
      (member) => member.userId
    );

    const secondExecutionResult = await detectAndNotifyUnsubmittedMembers(
      testInput
    );
    const secondOrderedUserIds = secondExecutionResult.unsubmittedMembers.map(
      (member) => member.userId
    );

    const thirdExecutionResult = await detectAndNotifyUnsubmittedMembers(
      testInput
    );
    const thirdOrderedUserIds = thirdExecutionResult.unsubmittedMembers.map(
      (member) => member.userId
    );

    expect(firstOrderedUserIds).toEqual(secondOrderedUserIds);
    expect(secondOrderedUserIds).toEqual(thirdOrderedUserIds);

    const uniqueUserIds = new Set(firstOrderedUserIds);
    expect(uniqueUserIds.size).toBe(firstOrderedUserIds.length);

    expect(firstExecutionResult.unsubmittedMembers).toHaveLength(5);
    expect(secondExecutionResult.unsubmittedMembers).toHaveLength(5);
    expect(thirdExecutionResult.unsubmittedMembers).toHaveLength(5);
  });
});