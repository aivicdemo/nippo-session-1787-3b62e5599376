import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type ReportSubmissionInput, type ReportSubmissionRecord } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submission', () => {
  // SCEN-248: [normal] 報告遅延判定機能 - 報告送信時刻が期限内の場合、遅延フラグが false で記録される
  test('should record isWithinDeadline as false when submission is within deadline', () => {
    // Arrange: 期限時刻を設定（例：09:00 JST）
    const deadlineTime = new Date('2024-01-15T09:00:00Z');
    // テスト実行時刻を期限の30分前に設定（08:30 JST）
    const submissionTime = new Date('2024-01-15T08:30:00Z');

    const input: ReportSubmissionInput = {
      reportId: 'report-001',
      userId: 'user-123',
      submissionTimestamp: submissionTime,
      reportContent: {
        yesterdayAccomplishment: 'Yesterday task 1 completed successfully',
        todayPlan: 'Today plan item 1 scheduled',
        challenges: 'Current challenge identified'
      }
    };

    // Act: 日報を送信
    const result: ReportSubmissionRecord = submitDailyReport(input, deadlineTime);

    // Assert: 送信が期限内であることを確認
    expect(result.recordId).toBeDefined();
    expect(result.reportId).toBe('report-001');
    expect(result.submissionTimestamp).toEqual(submissionTime);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.deadlineComparisonResult.status).toBe('on_time');
    expect(result.deadlineComparisonResult.minutesBeforeDeadline).toBe(30);
    expect(result.recordedAt).toBeDefined();
  });
});