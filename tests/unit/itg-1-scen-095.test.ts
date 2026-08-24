import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示', () => {
  // SCEN-095
  test('朝会開始予定時刻が不正な日時フォーマットのとき、エラーが発生する', () => {
    const invalidInput: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2026-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    const invalidScheduledTime = '2026-13-45T99:99:99Z';

    expect(() => {
      aggregateReportSubmissionStatus(invalidInput, {
        scheduledTime: new Date(invalidScheduledTime),
      } as any);
    }).toThrow(/朝会開始予定時刻/);
  });
});