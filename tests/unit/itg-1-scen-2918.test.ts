import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー抽出機能 - リスト順序の影響テスト', () => {
  // SCEN-2918
  test('メンバー一覧の順序が逆順の場合でも未提出判定の結果は変わらない', () => {
    // Arrange: スタブ化されたNotificationServiceAdapter
    const notificationCallLog: Array<{ userId: string; message: string }> = [];
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        notificationCallLog.push({ userId, message });
        return { success: true, sentAt: new Date('2024-01-15T09:00:00Z') };
      }),
      scheduleNotification: jest.fn(async () => ({})),
      getDeliveryStatus: jest.fn(async () => ({})),
    };

    // メンバーリスト（正順: A→Z）
    const membersNormalOrder = [
      { userId: 'user_001', userName: 'Alice', email: 'alice@example.com' },
      { userId: 'user_002', userName: 'Bob', email: 'bob@example.com' },
      { userId: 'user_003', userName: 'Charlie', email: 'charlie@example.com' },
      { userId: 'user_004', userName: 'Diana', email: 'diana@example.com' },
      { userId: 'user_005', userName: 'Eve', email: 'eve@example.com' },
    ];

    // メンバーリスト（逆順: Z→A）
    const membersReverseOrder = [...membersNormalOrder].reverse();

    // 提出済みメンバーID（user_001, user_003）
    const submittedMemberIds = new Set(['user_001', 'user_003']);

    const teamId = 'team_alpha';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'manager_001';

    // Act 1: 正順でのメンバーリストで未提出メンバー抽出を実行
    const inputNormalOrder: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
      memberList: membersNormalOrder,
      submittedMemberIds,
      notificationServiceAdapter: notificationServiceAdapterStub as any,
    };

    const resultNormalOrder: DetectUnsubmittedMembersOutput = detectAndNotifyUnsubmittedMembers(
      inputNormalOrder
    );

    // 正順実行時の通知呼び出し数を記録
    const notificationCountNormalOrder = notificationCallLog.length;
    const unsubmittedMemberIdsNormalOrder = new Set(
      resultNormalOrder.unsubmittedMembers.map(m => m.userId)
    );

    // Reset notification call log for reverse order test
    notificationCallLog.length = 0;
    notificationServiceAdapterStub.sendReminderNotification.mockClear();

    // Act 2: 逆順でのメンバーリストで未提出メンバー抽出を実行
    const inputReverseOrder: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
      memberList: membersReverseOrder,
      submittedMemberIds,
      notificationServiceAdapter: notificationServiceAdapterStub as any,
    };

    const resultReverseOrder: DetectUnsubmittedMembersOutput = detectAndNotifyUnsubmittedMembers(
      inputReverseOrder
    );

    // 逆順実行時の通知呼び出し数を記録
    const notificationCountReverseOrder = notificationCallLog.length;
    const unsubmittedMemberIdsReverseOrder = new Set(
      resultReverseOrder.unsubmittedMembers.map(m => m.userId)
    );

    // Assert: 両実行結果が同一であることを確認

    // 未提出メンバーIDセットが同一
    expect(unsubmittedMemberIdsNormalOrder).toEqual(unsubmittedMemberIdsReverseOrder);

    // 未提出メンバーIDセットに正しいメンバーが含まれている
    expect(unsubmittedMemberIdsNormalOrder).toEqual(new Set(['user_002', 'user_004', 'user_005']));

    // 未提出メンバー数が同一
    expect(resultNormalOrder.unsubmittedMembers.length).toBe(3);
    expect(resultReverseOrder.unsubmittedMembers.length).toBe(3);

    // 通知呼び出し回数が同一
    expect(notificationCountNormalOrder).toBe(notificationCountReverseOrder);
    expect(notificationCountNormalOrder).toBe(3);

    // 各メンバーの詳細情報が正順・逆順で一致
    const normalOrderByUserId = new Map(
      resultNormalOrder.unsubmittedMembers.map(m => [m.userId, m])
    );
    const reverseOrderByUserId = new Map(
      resultReverseOrder.unsubmittedMembers.map(m => [m.userId, m])
    );

    for (const userId of unsubmittedMemberIdsNormalOrder) {
      const normalMember = normalOrderByUserId.get(userId);
      const reverseMember = reverseOrderByUserId.get(userId);

      expect(normalMember).toBeDefined();
      expect(reverseMember).toBeDefined();
      expect(normalMember?.userName).toBe(reverseMember?.userName);
      expect(normalMember?.email).toBe(reverseMember?.email);
      expect(normalMember?.remainingMinutes).toBe(reverseMember?.remainingMinutes);
    }

    // 通知失敗数が同一
    expect(resultNormalOrder.notificationFailures.length).toBe(
      resultReverseOrder.notificationFailures.length
    );

    // 実行日時フォーマットが ISO 8601 形式であることを確認
    expect(resultNormalOrder.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(resultReverseOrder.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});