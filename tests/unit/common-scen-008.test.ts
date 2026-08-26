import { updateRemindSchedule } from '../../src/logic/remind-schedule-management';

describe('remind-schedule-management', () => {
  // SCEN-008
  test('should throw UNAUTHORIZED error when user lacks permission to update schedule', async () => {
    const scheduleId = 'schedule-001';
    const unauthorizedUserId = 'user-B';
    
    const updateInput = {
      scheduleId,
      sendTime: '09:00',
      targetTeamIds: ['team-2'],
      isEnabled: false,
    };

    await expect(
      updateRemindSchedule(updateInput, unauthorizedUserId)
    ).rejects.toThrow(/権限/);
  });
});