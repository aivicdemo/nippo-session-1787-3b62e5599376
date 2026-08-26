import { toggleRemindScheduleStatus } from '../../src/logic/remind-schedule-management';

describe('toggleRemindScheduleStatus', () => {
  // SCEN-012
  test('should return persistence error message when database save fails', async () => {
    const toggleInput = {
      scheduleId: 'schedule-001',
      enabled: false,
      userId: 'user-001',
    };

    const persistenceError = new Error('スケジュール状態の保存に失敗しました。');
    persistenceError.name = 'PERSISTENCE_ERROR';

    try {
      await toggleRemindScheduleStatus(toggleInput);
      fail('should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('スケジュール状態の保存に失敗しました。');
    }
  });
});