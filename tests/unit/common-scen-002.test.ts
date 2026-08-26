import { createRemindSchedule } from '../../src/logic/remind-schedule-management';
import type { CreateRemindScheduleInput } from '../../src/logic/remind-schedule-management';

describe('remind-schedule-management', () => {
  // SCEN-002
  test('should throw error when schedule configuration violates business rules', () => {
    const invalidInputWithoutSendTime: CreateRemindScheduleInput = {
      scheduleName: 'Daily Reminder',
      sendTime: '',
      targetTeamIds: ['team-001'],
      targetMemberIds: ['member-001'],
      isEnabled: true,
    };

    expect(() => createRemindSchedule(invalidInputWithoutSendTime)).toThrow(
      /スケジュール設定が無効です。送信時刻、対象チーム、メンバーを確認してください。/
    );
  });

  test('should throw error when target teams are empty', () => {
    const invalidInputWithoutTeams: CreateRemindScheduleInput = {
      scheduleName: 'Daily Reminder',
      sendTime: '09:00',
      targetTeamIds: [],
      targetMemberIds: ['member-001'],
      isEnabled: true,
    };

    expect(() => createRemindSchedule(invalidInputWithoutTeams)).toThrow(
      /スケジュール設定が無効です。送信時刻、対象チーム、メンバーを確認してください。/
    );
  });

  test('should throw error when target members are empty', () => {
    const invalidInputWithoutMembers: CreateRemindScheduleInput = {
      scheduleName: 'Daily Reminder',
      sendTime: '09:00',
      targetTeamIds: ['team-001'],
      targetMemberIds: [],
      isEnabled: true,
    };

    expect(() => createRemindSchedule(invalidInputWithoutMembers)).toThrow(
      /スケジュール設定が無効です。送信時刻、対象チーム、メンバーを確認してください。/
    );
  });
});