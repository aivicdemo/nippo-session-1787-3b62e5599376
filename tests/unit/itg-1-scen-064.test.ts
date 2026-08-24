import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-064: [normal] 日報送信タイムスタンプ記録と期限判定機能 - 記録されたタイムスタンプが朝会開始時刻と一致する場合、期限内判定が true を返す
  test('朝会開始時刻ちょうどに送信した日報は期限内判定が true を返す', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionTimestamp = new Date('2024-01-15T09:00:00Z');

    const input = {
      userId: 'user-001',
      teamId: 'team-A',
      yesterdayAccomplishment: '前日のタスク完了',
      todayPlan: '本日のタスク予定',
      challenges: '抱えている課題',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input, submissionTimestamp, morningMeetingStartTime);

    expect(result).toEqual({
      reportId: expect.any(String),
      submissionTimestamp: submissionTimestamp.toISOString(),
      isWithinDeadline: true,
    });

    expect(result.isWithinDeadline).toBe(true);
  });
});