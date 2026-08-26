import { toggleRemindScheduleStatus } from '../../src/logic/remind-schedule-management';

describe('toggleRemindScheduleStatus', () => {
  // SCEN-009
  test('should toggle remind schedule status from enabled to disabled and back, persisting changes', () => {
    const scheduleId = 'schedule-001';
    const userId = 'user-001';

    // First toggle: enabled (true) → disabled (false)
    const firstToggleResult = toggleRemindScheduleStatus({
      scheduleId,
      enabled: false,
      userId,
    });

    expect(firstToggleResult.isEnabled).toBe(false);
    expect(firstToggleResult.scheduleId).toBe(scheduleId);

    // Second toggle: disabled (false) → enabled (true)
    const secondToggleResult = toggleRemindScheduleStatus({
      scheduleId,
      enabled: true,
      userId,
    });

    expect(secondToggleResult.isEnabled).toBe(true);
    expect(secondToggleResult.scheduleId).toBe(scheduleId);
  });
});