import { updateRemindSchedule } from '../../src/logic/remind-schedule-management';

describe('updateRemindSchedule', () => {
  // SCEN-008
  test('should throw UNAUTHORIZED error when user lacks update permission', async () => {
    const scheduleId = 'schedule-001';
    const creatorUserId = 'user-A';
    const requestingUserId = 'user-B';
    const sendTime = '08:00';
    const targetTeamIds = ['team-1'];
    const isEnabled = true;

    const updateInput = {
      scheduleId,
      sendTime: '09:00',
      targetTeamIds: ['team-2'],
      isEnabled: false,
    };

    expect(() => updateRemindSchedule(updateInput, requestingUserId)).toThrow(/権限/);
  });
});