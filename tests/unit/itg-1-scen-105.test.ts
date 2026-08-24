import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長ダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-105
  test('提出期限時刻が朝会開始予定時刻より前のとき、ビジネスロジック矛盾エラーが発生する', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      morningMeetingStartTime: '09:00',
      reportDeadlineTime: '08:30',
    };

    expect(() => {
      aggregateReportSubmissionStatus(input);
    }).toThrow(/提出期限時刻は朝会開始予定時刻以降である必要があります/);
  });
});