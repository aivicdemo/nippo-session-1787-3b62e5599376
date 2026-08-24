import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput, NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能 - NotificationServiceAdapter失敗時の動作', () => {
  test('SCEN-2862: NotificationServiceAdapterが失敗状態のとき、代替動作に切り替わらずエラーが上位層に伝播する', async () => {
    // ========== Setup: NotificationServiceAdapter のスタブを失敗状態に設定 ==========
    const notificationServiceAdapterStub = {
      sendReminderNotification: async () => {
        throw new Error('NotificationServiceAdapter call failed: Connection timeout');
      },
      scheduleNotification: async () => {
        throw new Error('NotificationServiceAdapter call failed: Schedule error');
      },
      getDeliveryStatus: async () => ({
        delivered: 0,
        failed: 0,
        pending: 0,
      }),
    };

    const systemLogStub: string[] = [];
    const errorAlertStub: { marked: boolean; reason: string } = { marked: false, reason: '' };

    // ========== Test Input: 未提出メンバー検出の入力パラメータ ==========
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'exec-user-001',
    };

    // ========== 期待値: NotificationServiceAdapterの失敗を検証 ==========
    // NotificationServiceAdapter が例外をスロー することを確認
    try {
      // 実際の関数呼び出しで NotificationServiceAdapter の失敗が伝播することを検証
      await detectAndNotifyUnsubmittedMembers(input, notificationServiceAdapterStub, systemLogStub, errorAlertStub);

      // 代替動作に切り替わるべきではないため、ここに到達してはいけない
      throw new Error('Expected NotificationServiceAdapter failure to propagate');
    } catch (error) {
      // NotificationServiceAdapter 呼び出し失敗のエラーが上位層に伝播することを確認
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/NotificationServiceAdapter call failed/);

      // キャッシュへのフォールバック処理が実行されていないことを確認
      // 代替動作が行われない場合、systemLog には 'NotificationServiceAdapter呼び出し失敗' が記録される
      const hasAdapterFailureLog = systemLogStub.some(log =>
        log.includes('NotificationServiceAdapter呼び出し失敗') ||
        log.includes('Connection timeout')
      );
      expect(hasAdapterFailureLog).toBe(true);

      // キャッシュ表示への自動切り替えが行われていないことを確認
      const hasFallbackToCache = systemLogStub.some(log =>
        log.includes('フォールバック') ||
        log.includes('キャッシュ') ||
        log.includes('cached notification')
      );
      expect(hasFallbackToCache).toBe(false);

      // 管理者アラート対象としてマークされていることを確認
      expect(errorAlertStub.marked).toBe(true);
      expect(errorAlertStub.reason).toMatch(/NotificationServiceAdapter/);
    }

    // ========== 追加検証: システムログにエラー記録が残されていることを確認 ==========
    // システムログには適切なエラーメッセージが記録されているはず
    expect(systemLogStub.length).toBeGreaterThan(0);
    expect(systemLogStub.some(log => log.includes('fail'))).toBe(true);
  });
});