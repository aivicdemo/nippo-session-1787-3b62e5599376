import { createRemindSchedule } from '../../src/logic/remind-schedule-management';
import { type CreateRemindScheduleInput, type RemindSchedule } from '../../src/logic/remind-schedule-management';

describe('RemindScheduleManagement', () => {
  // SCEN-001
  test('should create a new remind notification schedule and persist schedule configuration', async () => {
    const input: CreateRemindScheduleInput = {
      scheduleName: '朝会報告リマインド',
      sendTime: '07:00',
      targetTeamIds: [],
      targetMemberIds: [
        'member_001',
        'member_002',
        'member_003',
        'member_004',
        'member_005',
        'member_006',
        'member_007',
        'member_008',
        'member_009',
        'member_010',
      ],
      isEnabled: true,
    };

    const result: RemindSchedule = await createRemindSchedule(input);

    expect(result.scheduleName).toBe('朝会報告リマインド');
    expect(result.sendTime).toBe('07:00');
    expect(result.targetMemberIds).toHaveLength(10);
    expect(result.targetMemberIds).toEqual(input.targetMemberIds);
    expect(result.isEnabled).toBe(true);
    expect(result.scheduleId).toBeDefined();
    expect(typeof result.scheduleId).toBe('string');
    expect(result.scheduleId.length).toBeGreaterThan(0);
    expect(result.createdAt).toBeDefined();
    expect(typeof result.createdAt).toBe('string');
    expect(result.updatedAt).toBeDefined();
    expect(typeof result.updatedAt).toBe('string');
    expect(new Date(result.createdAt)).toBeInstanceOf(Date);
    expect(new Date(result.updatedAt)).toBeInstanceOf(Date);
  });
});