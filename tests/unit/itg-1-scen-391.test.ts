import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能 - 月初日のメンバーリスト参照', () => {
  test('SCEN-391: 月初日スケジュール発火時に当月メンバーのみが対象となること', async () => {
    // テスト実行日時を2026年9月1日（月）の朝6:00に設定
    const scheduledTime = new Date('2026-09-01T06:00:00Z');
    const reportDeadlineTime = new Date('2026-09-01T10:00:00Z');

    // テストデータ準備：前月（8月）のメンバーリスト5名
    const previousMonthMembers = [
      { userId: 'pm-aug-001', userName: 'member_aug_001', email: 'member1.aug@example.com' },
      { userId: 'pm-aug-002', userName: 'member_aug_002', email: 'member2.aug@example.com' },
      { userId: 'pm-aug-003', userName: 'member_aug_003', email: 'member3.aug@example.com' },
      { userId: 'pm-aug-004', userName: 'member_aug_004', email: 'member4.aug@example.com' },
      { userId: 'pm-aug-005', userName: 'member_aug_005', email: 'member5.aug@example.com' },
    ];

    // テストデータ準備：当月（9月）のメンバーリスト10名
    const currentMonthMembers = [
      { userId: 'pm-sep-001', userName: 'member_sep_001', email: 'member1.sep@example.com' },
      { userId: 'pm-sep-002', userName: 'member_sep_002', email: 'member2.sep@example.com' },
      { userId: 'pm-sep-003', userName: 'member_sep_003', email: 'member3.sep@example.com' },
      { userId: 'pm-sep-004', userName: 'member_sep_004', email: 'member4.sep@example.com' },
      { userId: 'pm-sep-005', userName: 'member_sep_005', email: 'member5.sep@example.com' },
      { userId: 'pm-sep-006', userName: 'member_sep_006', email: 'member6.sep@example.com' },
      { userId: 'pm-sep-007', userName: 'member_sep_007', email: 'member7.sep@example.com' },
      { userId: 'pm-sep-008', userName: 'member_sep_008', email: 'member8.sep@example.com' },
      { userId: 'pm-sep-009', userName: 'member_sep_009', email: 'member9.sep@example.com' },
      { userId: 'pm-sep-010', userName: 'member_sep_010', email: 'member10.sep@example.com' },
    ];

    // NotificationServiceAdapterをモック化
    const notificationCallHistory: Array<{ userId: string; sentAt: Date | null; status: string }> = [];
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]) => {
        notificationCallHistory.push({
          userId,
          sentAt: new Date(),
          status: 'sent',
        });
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date(),
          errorMessage: null,
        };
      }),
    };

    // sendDailyReportReminder呼び出し入力データ
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'slack'],
    };

    // 定時リマインド送信機能のスケジュール発火処理を実行
    // 注：実装側で当月メンバーのみをフィルタリングする必要がある
    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      {
        // 当月メンバーのみをリスト化
        getTeamMembersForMonth: jest.fn(async () => currentMonthMembers),
      }
    );

    // アサート1：sendReminderNotificationが正確に10回呼び出されたこと
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    // アサート2：呼び出し対象ユーザーが当月（9月）のメンバーリスト10名のみであること
    const calledUserIds = notificationCallHistory.map((call) => call.userId);
    const expectedUserIds = currentMonthMembers.map((member) => member.userId);
    expect(calledUserIds).toEqual(expect.arrayContaining(expectedUserIds));
    expect(calledUserIds).toHaveLength(10);

    // アサート3：前月（8月）のメンバーリスト5名は対象に含まれていないこと
    const previousMonthUserIds = previousMonthMembers.map((member) => member.userId);
    previousMonthUserIds.forEach((userId) => {
      expect(calledUserIds).not.toContain(userId);
    });

    // アサート4：戻り値の送信件数が10であること
    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);

    // アサート5：remainingTimeMinutesが正の値（報告期限までの残り時間）であること
    const deadlineMinutesRemaining = (reportDeadlineTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
    expect(result.remainingTimeMinutes).toBe(Math.floor(deadlineMinutesRemaining));

    // アサート6：各通知のステータスが'sent'であること
    result.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeDefined();
      expect(detail.errorMessage).toBeNull();
    });
  });
});