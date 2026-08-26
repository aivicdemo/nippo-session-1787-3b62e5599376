import { updateRemindSchedule } from '../../src/logic/remind-schedule-management';

describe('Remind Schedule Management', () => {
  // SCEN-005
  test('should update existing remind schedule with new send time, target members, and enabled status', async () => {
    const scheduleIdToUpdate = 'schedule-001';
    const originalSchedule = {
      scheduleId: 'schedule-001',
      scheduleName: 'Morning Standup Reminder',
      sendTime: '08:00',
      targetTeamIds: ['team-001'],
      targetMemberIds: ['member-001', 'member-002'],
      isEnabled: true,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    };

    const updateInput = {
      scheduleId: scheduleIdToUpdate,
      sendTime: '09:30',
      targetMemberIds: ['member-003', 'member-004'],
      isEnabled: false,
    };

    const updatedSchedule = await updateRemindSchedule(updateInput);

    expect(updatedSchedule.scheduleId).toBe('schedule-001');
    expect(updatedSchedule.scheduleName).toBe('Morning Standup Reminder');
    expect(updatedSchedule.sendTime).toBe('09:30');
    expect(updatedSchedule.targetTeamIds).toEqual(['team-001']);
    expect(updatedSchedule.targetMemberIds).toEqual(['member-003', 'member-004']);
    expect(updatedSchedule.isEnabled).toBe(false);
    expect(updatedSchedule.createdAt).toBe('2024-01-10T10:00:00Z');
    expect(typeof updatedSchedule.updatedAt).toBe('string');
  });
});