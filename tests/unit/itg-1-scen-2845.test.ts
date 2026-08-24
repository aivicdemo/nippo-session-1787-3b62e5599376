import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  test('SCEN-2845: 未提出メンバーが複数名のとき、全未提出メンバーに催促通知が送信される', async () => {
    // モック用の通知サービスアダプター
    const mockNotificationCalls: Array<{ userId: string; sentAt: Date }> = [];
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        mockNotificationCalls.push({
          userId,
          sentAt: new Date('2024-01-15T09:00:00Z'),
        });
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T09:00:00Z'),
          errorMessage: null,
        };
      }),
    };

    // テスト入力：10名中3名が未提出
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'admin-001',
    };

    // 未提出メンバーリスト
    const unsubmittedMembers: UnsubmittedMember[] = [
      {
        userId: 'user-001',
        userName: 'Engineer A',
        email: 'engineer.a@example.com',
        remainingMinutes: -30, // 期限超過30分
      },
      {
        userId: 'user-002',
        userName: 'Engineer B',
        email: 'engineer.b@example.com',
        remainingMinutes: -15, // 期限超過15分
      },
      {
        userId: 'user-003',
        userName: 'Engineer C',
        email: 'engineer.c@example.com',
        remainingMinutes: 5, // 期限まで5分
      },
    ];

    // 提出済みメンバーリスト（7名）
    const submittedMembers: UnsubmittedMember[] = [];
    for (let i = 4; i <= 10; i++) {
      submittedMembers.push({
        userId: `user-${String(i).padStart(3, '0')}`,
        userName: `Engineer ${String.fromCharCode(64 + i)}`,
        email: `engineer.${String.fromCharCode(97 + i - 1)}@example.com`,
        remainingMinutes: 0,
      });
    }

    // 関数を呼び出し
    const output = await detectAndNotifyUnsubmittedMembers(
      input,
      unsubmittedMembers,
      mockNotificationServiceAdapter,
    );

    // 検証 1: sendReminderNotification が3回呼び出されたことを確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(
      3,
    );

    // 検証 2: 各呼び出しユーザーID確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      1,
      'user-001',
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      2,
      'user-002',
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      3,
      'user-003',
    );

    // 検証 3: 出力結果確認
    expect(output.notificationsSent).toBe(3);
    expect(output.notificationFailures).toEqual([]);

    // 検証 4: 通知ログレコードの確認
    expect(output.unsubmittedMembers).toHaveLength(3);
    expect(output.unsubmittedMembers[0].userId).toBe('user-001');
    expect(output.unsubmittedMembers[1].userId).toBe('user-002');
    expect(output.unsubmittedMembers[2].userId).toBe('user-003');

    // 検証 5: モック呼び出し履歴確認
    expect(mockNotificationCalls).toHaveLength(3);
    expect(mockNotificationCalls[0].userId).toBe('user-001');
    expect(mockNotificationCalls[1].userId).toBe('user-002');
    expect(mockNotificationCalls[2].userId).toBe('user-003');

    // 検証 6: 提出済みメンバーに対して通知が送信されていないことを確認
    const notifiedUserIds = mockNotificationCalls.map((call) => call.userId);
    submittedMembers.forEach((member) => {
      expect(notifiedUserIds).not.toContain(member.userId);
    });

    // 検証 7: executedAtがISO 8601形式であることを確認
    expect(output.executedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/,
    );
  });
});

// 型定義（テスト内で必要）
interface DetectUnsubmittedMembersInput {
  teamId: string;
  reportDate: string;
  morningMeetingStartTime: string;
  executorUserId: string;
}

interface UnsubmittedMember {
  userId: string;
  userName: string;
  email: string;
  remainingMinutes: number;
}

interface NotificationServiceAdapter {
  sendReminderNotification: (userId: string) => Promise<{
    userId: string;
    status: 'sent' | 'failed' | 'skipped';
    sentAt: Date | null;
    errorMessage: string | null;
  }>;
}