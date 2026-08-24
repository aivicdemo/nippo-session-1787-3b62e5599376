import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking - aggregateReportSubmissionStatus', () => {
  // SCEN-2911: [edge] 報告受付終了判定機能 - 朝会開始時刻を1秒未満で経過した場合報告受付が終了する
  test('should reject report submission when submission deadline has passed by sub-second interval', async () => {
    const morningMeetingStartTime = '09:00:00';
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-001';

    const mockCurrentTime = new Date('2024-01-15T09:00:00.500Z');
    const mockNow = jest.spyOn(Date, 'now').mockReturnValue(mockCurrentTime.getTime());

    try {
      const input: AggregateReportSubmissionStatusInput = {
        teamId,
        reportDate,
        requestUserId,
        includeDelayedSubmissions: true,
      };

      expect(() => aggregateReportSubmissionStatus(input)).toThrow(/受付終了/);
    } finally {
      mockNow.mockRestore();
    }
  });
});