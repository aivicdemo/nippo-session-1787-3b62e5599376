import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー抽出機能 - 提出記録が null の場合', () => {
  // SCEN-1653
  test('メンバーごとの報告提出記録が null のまま未提出判定を実行しようとしたとき、処理を中止しエラーを返す', async () => {
    // テスト環境初期化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T10:00:00Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue([]),
    };

    // メンバー10名のデータセット準備
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const executorUserId = 'exec-001';
    const morningMeetingStartTime = '09:00';

    // 報告提出記録を意図的に null のままにする状態を再現
    // (データベース/キャッシュ層で記録が欠落した状態)
    const unsubmittedMembersWithNullRecord = null;

    // 未提出判定処理を実行
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime,
        executorUserId,
      },
      mockNotificationServiceAdapter
    );

    // 期待値: エラーコード『SUBMISSION_RECORD_NULL』を含むエラーオブジェクト
    expect(result).toHaveProperty('errorCode');
    expect(result.errorCode).toMatch(/SUBMISSION_RECORD_NULL/);

    // エラーメッセージの検証
    expect(result).toHaveProperty('message');
    expect(result.message).toMatch(/報告提出記録がnull/);

    // 処理が中止されたことを確認（外部サービスへの呼び出しがないこと）
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // ログに『報告提出記録がnullのため未提出判定を実行できません』が記録される
    expect(result).toHaveProperty('timestamp');
    expect(result.timestamp).toBeDefined();

    // 管理者アラート機能が動作していないことを確認
    expect(result).toHaveProperty('escalated');
    expect(result.escalated).toBe(false);
  });
});