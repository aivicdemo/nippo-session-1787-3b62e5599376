import { toggleRemindScheduleStatus } from '../../src/logic/remind-schedule-management';

describe('toggleRemindScheduleStatus', () => {
  // SCEN-010
  test('should throw error when schedule ID does not exist', async () => {
    const input = {
      scheduleId: 'non-existent-id-12345',
      enabled: true,
      userId: 'user-001',
    };

    await expect(toggleRemindScheduleStatus(input)).rejects.toThrow(/見つかりません/);
  });
});