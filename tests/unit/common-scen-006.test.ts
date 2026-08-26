import { updateRemindSchedule } from '../../src/logic/remind-schedule-management';

describe('RemindScheduleManagement', () => {
  // SCEN-006
  test('should throw error when schedule ID does not exist', () => {
    const nonExistentScheduleId = 'non-existent-schedule-id';
    const updateInput = {
      scheduleId: nonExistentScheduleId,
      sendTime: '10:30',
      targetTeamIds: ['team-001'],
      targetMemberIds: ['member-001'],
      isEnabled: false,
    };

    expect(() => updateRemindSchedule(updateInput)).toThrow(/リマインド通知スケジュールが見つかりません/);
  });
});