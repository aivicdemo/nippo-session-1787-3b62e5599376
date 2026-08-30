import { sendUnsubmittedMemberReminders } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム', () => {
  test('SCEN-628: [normal] 報告期限前に未提出メンバーを検出して段階的な催促通知を送信し、再催促ルールに基づいて通知方法を変更する', () => {
    const meetingStartTime = new Date('2026-08-20T09:00:00Z');
    const reportingDeadlineMinutesBefore = 30;
    const teamMemberIds = ['user001', 'user002', 'user003'];
    const submittedReportsByDate = {
      user001: true,
      user002: false,
      user003: false,
    };
    const currentTime = new Date('2026-08-20T08:00:00Z');

    const result = sendUnsubmittedMemberReminders(
      meetingStartTime,
      reportingDeadlineMinutesBefore,
      teamMemberIds,
      submittedReportsByDate,
      currentTime,
    );

    expect(result.reminderTargetMemberIds).toEqual(['user002', 'user003']);
    expect(result.submissionStatus).toEqual({
      user001: 'submitted',
      user002: 'pending',
      user003: 'pending',
    });
    expect(result.acceptanceClosedFlag).toBe(false);
    expect(result.timeRemainingMinutes).toBe(30);
  });
});