import { updateRemindSchedule } from '../../src/logic/remind-schedule-management';

describe('RemindScheduleManagement', () => {
  // SCEN-007
  test('should throw error when sendTime format is invalid or targetMembers is empty', async () => {
    const initialSchedule = {
      scheduleId: 'schedule-001',
      sendTime: '09:00',
      targetTeamIds: [],
      targetMemberIds: ['member-001', 'member-002'],
      isEnabled: true,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
    };

    // Test case 1: Invalid sendTime format
    const updateInputInvalidTime = {
      scheduleId: 'schedule-001',
      sendTime: '25:99',
      targetTeamIds: [],
      targetMemberIds: ['member-001', 'member-002'],
      isEnabled: true,
    };

    expect(() => updateRemindSchedule(updateInputInvalidTime)).toThrow(/スケジュール設定が無効です/);

    // Test case 2: Empty targetMembers
    const updateInputEmptyMembers = {
      scheduleId: 'schedule-001',
      sendTime: '09:00',
      targetTeamIds: [],
      targetMemberIds: [],
      isEnabled: true,
    };

    expect(() => updateRemindSchedule(updateInputEmptyMembers)).toThrow(/スケジュール設定が無効です/);
  });
});