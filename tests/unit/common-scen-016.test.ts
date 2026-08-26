import { listRemindSchedules, type ListRemindSchedulesInput } from '../../src/logic/remind-schedule-management';

describe('RemindScheduleManagement - listRemindSchedules', () => {
  // SCEN-016
  test('should throw error when timeToDeadline calculation fails due to invalid date format', async () => {
    const input: ListRemindSchedulesInput = {
      userId: 'user-001',
      filterStatus: 'all',
    };

    const mockSchedulesWithInvalidDate = [
      {
        scheduleId: 'schedule-001',
        scheduleName: 'Morning Standup Reminder',
        sendTime: '09:00',
        targetTeamIds: ['team-001'],
        targetMemberIds: ['member-001'],
        isEnabled: true,
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
      },
      {
        scheduleId: 'schedule-002',
        scheduleName: 'Afternoon Standup Reminder',
        sendTime: '14:00',
        targetTeamIds: ['team-002'],
        targetMemberIds: ['member-002'],
        isEnabled: true,
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
      },
      {
        scheduleId: 'schedule-003',
        scheduleName: 'Evening Report Reminder',
        sendTime: '17:00',
        targetTeamIds: ['team-003'],
        targetMemberIds: ['member-003'],
        isEnabled: false,
        createdAt: 'invalid-date-format',
        updatedAt: '2024-01-15T08:00:00Z',
      },
    ];

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSchedulesWithInvalidDate),
      } as Response)
    );

    expect(() => listRemindSchedules(input)).toThrow(/報告期限までの時間計算に失敗しました/);
  });
});