import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking', () => {
  // SCEN-347
  test('should throw validation error when issue field is empty string during submission status aggregation', () => {
    // Input data: report with empty issue field
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    // Mock report data with empty issue field
    const mockReportData = {
      userId: 'user-engineer-001',
      submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
      reportDate: new Date('2024-01-15'),
      teamId: 'team-001',
      yesterdayAccomplishments: 'タスクA完了',
      todayPlans: 'タスクB開始',
      issues: '', // Empty issue field - violates business rule
    };

    // The function should throw an error for empty issue field
    expect(() => {
      aggregateReportSubmissionStatus(input, mockReportData);
    }).toThrow(/課題/);
  });
});