import { createRemindSchedule } from '../../src/logic/remind-schedule-management';

describe('RemindScheduleManagement', () => {
  // SCEN-003
  test('should throw authorization error when user lacks remind schedule creation permission', () => {
    const input = {
      userId: 'user-001',
      scheduleName: 'テストスケジュール',
      cronExpression: '0 8 * * *',
      message: 'テスト通知',
    };

    expect(() => createRemindSchedule(input)).toThrow(/権限/);
  });
});