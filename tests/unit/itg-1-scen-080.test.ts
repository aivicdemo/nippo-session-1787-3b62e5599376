import { describe, test, expect, beforeEach } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Submission Deadline Check', () => {
  // SCEN-080: [edge] 日報送信期限判定機能 - 朝会開始時刻の1秒前に送信された日報が期限内と判定される
  test('should accept daily report submitted 1 second before morning meeting start time as within deadline', () => {
    // Setup: Define morning meeting start time
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionTimestamp = new Date('2024-01-15T08:59:59Z');

    // Create test input
    const reportInput: SubmitDailyReportInput = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Completed feature A implementation and unit tests',
      todayPlan: 'Start integration testing for feature A and begin feature B design',
      challenges: 'Database query optimization took longer than expected, may impact timeline',
      reportDate: '2024-01-15',
    };

    // Mock the submission context with 1 second before deadline
    const mockContext = {
      submissionTimestamp,
      morningMeetingStartTime,
    };

    // Execute: Submit daily report
    const result: SubmitDailyReportOutput = submitDailyReport(
      reportInput,
      mockContext.submissionTimestamp,
      mockContext.morningMeetingStartTime
    );

    // Assert: Report should be accepted as within deadline
    expect(result.isWithinDeadline).toBe(true);
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.submissionTimestamp).toBe(submissionTimestamp.toISOString());
  });
});