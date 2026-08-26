import { listRemindSchedules } from '../../src/logic/remind-schedule-management';

describe('リマインド通知スケジュール管理', () => {
  // SCEN-015
  test('スケジュールデータの読み込みに失敗した場合、エラーメッセージ「スケジュール情報の取得に失敗しました。」を返す', () => {
    const listRemindSchedulesInput = {
      userId: 'user-123',
      filterStatus: 'all' as const,
    };

    expect(() => listRemindSchedules(listRemindSchedulesInput)).toThrow(
      /スケジュール情報の取得に失敗しました/
    );
  });
});