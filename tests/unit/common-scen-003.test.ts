import { createRemindSchedule } from '../../src/logic/remind-schedule-management';

describe('共通', () => {
  // SCEN-003
  test('呼び出し元ユーザーがリマインド通知スケジュール作成権限を持たない場合、Authorization例外が発生する', () => {
    const input = {
      userId: 'user-001',
      scheduleName: 'テストスケジュール',
      cronExpression: '0 8 * * *',
      message: 'テスト通知',
    };

    expect(() => createRemindSchedule(input)).toThrow(/権限/);
  });
});