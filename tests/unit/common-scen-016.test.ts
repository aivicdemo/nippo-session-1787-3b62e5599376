import { listRemindSchedules } from '../../src/logic/remind-schedule-management';

describe('listRemindSchedules', () => {
  test('SCEN-016', () => {
    const input = {
      userId: 'user-123',
      filterStatus: 'all' as const,
    };

    const mockSchedules = [
      {
        scheduleId: 'schedule-001',
        scheduleName: 'Morning Reminder 1',
        sendTime: '08:00',
        targetTeamIds: ['team-001'],
        targetMemberIds: ['member-001'],
        isEnabled: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        deadlineTime: null,
      },
      {
        scheduleId: 'schedule-002',
        scheduleName: 'Morning Reminder 2',
        sendTime: '09:00',
        targetTeamIds: ['team-002'],
        targetMemberIds: ['member-002'],
        isEnabled: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        deadlineTime: 'invalid-date-format',
      },
      {
        scheduleId: 'schedule-003',
        scheduleName: 'Morning Reminder 3',
        sendTime: '10:00',
        targetTeamIds: ['team-003'],
        targetMemberIds: ['member-003'],
        isEnabled: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        deadlineTime: undefined,
      },
    ];

    expect(() => {
      listRemindSchedules(input, mockSchedules);
    }).toThrow(/報告期限までの時間計算に失敗しました。/);
  });
});