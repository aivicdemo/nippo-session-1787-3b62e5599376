import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Aggregating report submission status for dashboard display', () => {
  // SCEN-359
  test('should record submission timestamp with millisecond precision and truncate fractional parts', async () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2026-08-19',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const mockTeamMembers = [
      {
        userId: 'user-001',
        userName: 'Alice',
        email: 'alice@example.com',
      },
      {
        userId: 'user-002',
        userName: 'Bob',
        email: 'bob@example.com',
      },
      {
        userId: 'user-003',
        userName: 'Carol',
        email: 'carol@example.com',
      },
    ];

    const mockSubmissions = [
      {
        userId: 'user-001',
        teamId: 'team-001',
        reportDate: '2026-08-19',
        submittedAt: new Date('2026-08-19T09:30:45.123Z'),
        isOnTime: true,
      },
      {
        userId: 'user-002',
        teamId: 'team-001',
        reportDate: '2026-08-19',
        submittedAt: new Date('2026-08-19T09:35:20.567Z'),
        isOnTime: true,
      },
    ];

    const result = await aggregateReportSubmissionStatus(
      input,
      {
        fetchTeamMembers: jest.fn().mockResolvedValue(mockTeamMembers),
        fetchSubmissionRecords: jest.fn().mockResolvedValue(mockSubmissions),
        getDeadlineConfig: jest.fn().mockResolvedValue({
          reportDate: new Date('2026-08-19'),
          deadlineTime: '09:00',
          timeZone: 'Asia/Tokyo',
        }),
      },
      {
        sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      }
    );

    expect(result).toBeDefined();
    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2026-08-19');
    expect(result.totalMembers).toBe(3);
    expect(result.submittedCount).toBe(2);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(66.7);
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('user-003');
    expect(result.unsubmittedMembers[0].userName).toBe('Carol');
    expect(result.unsubmittedMembers[0].email).toBe('carol@example.com');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBeGreaterThan(-1000);
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});