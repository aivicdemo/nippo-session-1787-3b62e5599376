import { updateRemindSchedule } from '../../src/logic/remind-schedule-management';
import { type UpdateRemindScheduleInput, type RemindSchedule } from '../../src/logic/remind-schedule-management';

const fetchMock = require('jest-fetch-mock');

describe('Remind Schedule Management', () => {
  // SCEN-005
  test('should update existing remind schedule with new send time, target members, and enabled status', async () => {
    fetchMock.resetMocks();

    const existingSchedule: RemindSchedule = {
      scheduleId: 'schedule-001',
      scheduleName: 'Daily Standup Reminder',
      sendTime: '08:00',
      targetTeamIds: ['team-001'],
      targetMemberIds: ['member-001', 'member-002'],
      isEnabled: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    const updateInput: UpdateRemindScheduleInput = {
      scheduleId: 'schedule-001',
      sendTime: '09:30',
      targetMemberIds: ['member-003', 'member-004'],
      isEnabled: false,
    };

    const expectedUpdatedSchedule: RemindSchedule = {
      scheduleId: 'schedule-001',
      scheduleName: 'Daily Standup Reminder',
      sendTime: '09:30',
      targetTeamIds: ['team-001'],
      targetMemberIds: ['member-003', 'member-004'],
      isEnabled: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-16T11:30:00Z',
    };

    fetchMock.mockResponseOnce(JSON.stringify(expectedUpdatedSchedule), { status: 200 });

    const result = await updateRemindSchedule(updateInput);

    expect(result.scheduleId).toBe('schedule-001');
    expect(result.sendTime).toBe('09:30');
    expect(result.targetMemberIds).toEqual(['member-003', 'member-004']);
    expect(result.isEnabled).toBe(false);
    expect(result.scheduleName).toBe('Daily Standup Reminder');
    expect(result.targetTeamIds).toEqual(['team-001']);
    expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
    expect(typeof result.updatedAt).toBe('string');
  });
});