import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Maximum Delay Edge Case', () => {
  // SCEN-268: [edge] 報告遅延判定機能 - 送信時刻が期限を23時間59分59秒超過した場合、業務上の最大遅延時間として処理される
  test('should judge report as MAXIMUM_DELAY_EXCEEDED when submission exceeds deadline by 23:59:59', async () => {
    const reportDeadlineUtc = new Date('2025-01-20T09:00:00Z');
    const submissionTimestampUtc = new Date('2025-01-21T09:23:59Z');
    const elapsedSeconds = Math.floor(
      (submissionTimestampUtc.getTime() - reportDeadlineUtc.getTime()) / 1000
    );
    const expectedDelaySeconds = 86399; // 23 * 3600 + 59 * 60 + 59

    const input: SubmitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-backend',
      yesterdayAccomplishment: '完了したタスクAを実装し、単体テストを追加した。',
      todayPlan: 'タスクBの設計レビューを実施し、実装を開始する予定。',
      challenges: 'データベース接続の遅延により調査が必要。',
      reportDate: '2025-01-21',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(
      input,
      reportDeadlineUtc,
      submissionTimestampUtc
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionTimestamp).toBe(submissionTimestampUtc.toISOString());

    // Verify delay calculation
    expect(elapsedSeconds).toBe(expectedDelaySeconds);
    expect(elapsedSeconds).toBeLessThan(86400); // Less than 24 hours
    expect(elapsedSeconds).toBeGreaterThanOrEqual(86399); // At least 23:59:59

    // Verify business rule: maximum delay status is assigned
    // The result should indicate this is within the maximum allowed business delay
    expect(result.delayStatus).toBe('MAXIMUM_DELAY_EXCEEDED');
    expect(result.delaySeconds).toBe(expectedDelaySeconds);
    expect(result.isMaximumBusinessDelay).toBe(true);
    expect(result.delayCategory).toBe('MAX_BUSINESS_DELAY');
  });
});