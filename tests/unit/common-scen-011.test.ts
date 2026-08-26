import { toggleRemindScheduleStatus } from '../../src/logic/remind-schedule-management';
import { type ToggleScheduleStatusInput } from '../../src/logic/remind-schedule-management';

describe('toggleRemindScheduleStatus', () => {
  // SCEN-011
  test('should throw error when user lacks permission to modify schedule', () => {
    const input: ToggleScheduleStatusInput = {
      scheduleId: 'schedule-001',
      enabled: false,
      userId: 'user-b',
    };

    expect(() => toggleRemindScheduleStatus(input)).toThrow(/権限/);
  });
});