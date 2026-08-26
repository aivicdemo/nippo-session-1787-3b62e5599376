import { updateRemindSchedule } from '../../src/logic/remind-schedule-management';

describe('リマインド通知スケジュール管理', () => {
  // SCEN-007
  test('無効な送信時刻または空の対象メンバーで更新時にエラーが発生する', () => {
    const initialSchedule = {
      scheduleId: 'schedule-001',
      scheduleName: 'Morning Reminder',
      sendTime: '09:00',
      targetTeamIds: ['team-001'],
      targetMemberIds: ['member-001', 'member-002'],
      isEnabled: true,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
    };

    const invalidSendTimeInput = {
      scheduleId: 'schedule-001',
      sendTime: '25:99',
      targetTeamIds: ['team-001'],
      targetMemberIds: ['member-001', 'member-002'],
      isEnabled: true,
    };

    expect(() => updateRemindSchedule(invalidSendTimeInput)).toThrow(
      /スケジュール設定が無効です/
    );

    const emptyMembersInput = {
      scheduleId: 'schedule-001',
      sendTime: '09:00',
      targetTeamIds: ['team-001'],
      targetMemberIds: [],
      isEnabled: true,
    };

    expect(() => updateRemindSchedule(emptyMembersInput)).toThrow(
      /スケジュール設定が無効です/
    );
  });
});