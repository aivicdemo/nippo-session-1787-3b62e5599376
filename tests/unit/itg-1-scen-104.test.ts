import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況（提出済み・未提出）をリアルタイム表示し、未提出メンバーを一目で把握できる機能', () => {
  // SCEN-104
  test('朝会開始予定時刻が現在時刻より過去のとき、エラーが発生する', () => {
    const now = new Date('2026-08-19T08:30:00Z');
    const pastMeetingTime = new Date('2026-08-19T08:00:00Z');

    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2026-08-19',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    jest.useFakeTimers();
    jest.setSystemTime(now);

    try {
      expect(() => {
        aggregateReportSubmissionStatus(input);
      }).toThrow(/朝会開始予定時刻/);
    } finally {
      jest.useRealTimers();
    }
  });
});