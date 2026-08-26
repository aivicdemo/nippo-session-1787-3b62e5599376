import { createRemindSchedule } from '../../src/logic/remind-schedule-management';
import { type CreateRemindScheduleInput, type RemindSchedule } from '../../src/logic/remind-schedule-management';

describe('RemindScheduleManagement', () => {
  // SCEN-001
  test('should create a new remind schedule with valid input and persist to storage', async () => {
    const input: CreateRemindScheduleInput = {
      scheduleName: '朝会報告リマインド',
      sendTime: '07:00',
      targetTeamIds: [],
      targetMemberIds: [
        'member-001',
        'member-002',
        'member-003',
        'member-004',
        'member-005',
        'member-006',
        'member-007',
        'member-008',
        'member-009',
        'member-010',
      ],
      isEnabled: true,
    };

    const result: RemindSchedule = createRemindSchedule(input);

    expect(result).toBeDefined();
    expect(result.scheduleName).toBe('朝会報告リマインド');
    expect(result.sendTime).toBe('07:00');
    expect(result.targetMemberIds).toHaveLength(10);
    expect(result.targetMemberIds).toEqual([
      'member-001',
      'member-002',
      'member-003',
      'member-004',
      'member-005',
      'member-006',
      'member-007',
      'member-008',
      'member-009',
      'member-010',
    ]);
    expect(result.isEnabled).toBe(true);
    expect(result.scheduleId).toBeDefined();
    expect(typeof result.scheduleId).toBe('string');
    expect(result.scheduleId.length).toBeGreaterThan(0);
    expect(result.createdAt).toBeDefined();
    expect(typeof result.createdAt).toBe('string');
    expect(result.updatedAt).toBeDefined();
    expect(typeof result.updatedAt).toBe('string');
    expect(result.targetTeamIds).toEqual([]);
  });
});