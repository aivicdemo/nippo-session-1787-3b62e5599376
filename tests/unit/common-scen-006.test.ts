import { updateRemindSchedule } from '../../src/logic/remind-schedule-management';
import { type UpdateRemindScheduleInput } from '../../src/logic/remind-schedule-management';

describe('remind-schedule-management', () => {
  // SCEN-006
  test('should throw error when schedule ID does not exist', () => {
    const updateInput: UpdateRemindScheduleInput = {
      scheduleId: 'non-existent-schedule-id',
      sendTime: '09:30',
      targetTeamIds: ['team-001'],
      targetMemberIds: ['member-001', 'member-002'],
      isEnabled: false,
    };

    expect(() => updateRemindSchedule(updateInput)).toThrow(
      /リマインド通知スケジュールが見つかりません/
    );
  });
});