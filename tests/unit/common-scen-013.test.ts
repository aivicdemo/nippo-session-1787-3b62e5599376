import { listRemindSchedules, type ListRemindSchedulesInput, type ListRemindSchedulesOutput } from '../../src/logic/remind-schedule-management';

describe('listRemindSchedules', () => {
  // SCEN-013
  test('should return list of remind schedules with correct enabled status, send time, target teams/members, and time until deadline', async () => {
    const input: ListRemindSchedulesInput = {
      userId: 'user-001',
      filterStatus: 'all',
    };

    const result: ListRemindSchedulesOutput = await listRemindSchedules(input);

    expect(result.schedules).toHaveLength(3);

    expect(result.schedules[0]).toMatchObject({
      isActive: true,
      sendTime: '08:00',
      targetTeams: ['営業部'],
      targetMembers: expect.arrayContaining(['member-01', 'member-02', 'member-03', 'member-04', 'member-05']),
      timeToDeadline: 60,
    });

    expect(result.schedules[1]).toMatchObject({
      isActive: true,
      sendTime: '08:30',
      targetTeams: ['企画部'],
      targetMembers: expect.arrayContaining(['member-06', 'member-07', 'member-08']),
      timeToDeadline: 90,
    });

    expect(result.schedules[2]).toMatchObject({
      isActive: false,
      sendTime: '09:00',
      targetTeams: ['管理部'],
      targetMembers: expect.arrayContaining(['member-09', 'member-10']),
      timeToDeadline: 120,
    });

    expect(result.totalCount).toBe(3);
    expect(result.retrievedAt).toBeDefined();
  });
});