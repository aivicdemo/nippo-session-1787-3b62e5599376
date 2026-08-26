import { listRemindSchedules, type ListRemindSchedulesInput, type ListRemindSchedulesOutput } from '../../src/logic/remind-schedule-management';

describe('RemindScheduleManagement', () => {
  // SCEN-013
  test('listRemindSchedules returns schedules with correct fields including enabled status, send time, target teams/members, and time until deadline', async () => {
    const input: ListRemindSchedulesInput = {
      userId: 'user-001',
      filterStatus: 'all',
    };

    const result: ListRemindSchedulesOutput = await listRemindSchedules(input);

    expect(result.schedules).toHaveLength(3);

    // First schedule: enabled, 08:00, sales team, 5 members
    expect(result.schedules[0].isActive).toBe(true);
    expect(result.schedules[0].sendTime).toBe('08:00');
    expect(result.schedules[0].targetTeams).toContain('sales-dept');
    expect(result.schedules[0].targetMembers).toHaveLength(5);
    expect(result.schedules[0].timeToDeadline).toBe(60);

    // Second schedule: enabled, 08:30, planning team, 3 members
    expect(result.schedules[1].isActive).toBe(true);
    expect(result.schedules[1].sendTime).toBe('08:30');
    expect(result.schedules[1].targetTeams).toContain('planning-dept');
    expect(result.schedules[1].targetMembers).toHaveLength(3);
    expect(result.schedules[1].timeToDeadline).toBe(90);

    // Third schedule: disabled, 09:00, admin team, 2 members
    expect(result.schedules[2].isActive).toBe(false);
    expect(result.schedules[2].sendTime).toBe('09:00');
    expect(result.schedules[2].targetTeams).toContain('admin-dept');
    expect(result.schedules[2].targetMembers).toHaveLength(2);
    expect(result.schedules[2].timeToDeadline).toBe(120);

    expect(result.totalCount).toBe(3);
    expect(result.retrievedAt).toBeDefined();
  });
});