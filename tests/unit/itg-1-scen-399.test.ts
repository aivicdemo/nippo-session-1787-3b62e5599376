import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボークに本日の報告提出状況をリアルタイム表示', () => {
  // SCEN-399
  test('報告提出状況の集計機能 - 本日の報告がすべて提出済みの場合、提出済み件数にすべてが計上される', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    const mockTeamMembers = [
      {
        userId: 'user-001',
        userName: 'Engineer A',
        email: 'engineer-a@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-002',
        userName: 'Engineer B',
        email: 'engineer-b@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-003',
        userName: 'Engineer C',
        email: 'engineer-c@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-004',
        userName: 'Engineer D',
        email: 'engineer-d@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-005',
        userName: 'Engineer E',
        email: 'engineer-e@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-006',
        userName: 'Engineer F',
        email: 'engineer-f@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-007',
        userName: 'Engineer G',
        email: 'engineer-g@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-008',
        userName: 'Engineer H',
        email: 'engineer-h@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-009',
        userName: 'Engineer I',
        email: 'engineer-i@company.com',
        teamId: teamId,
      },
      {
        userId: 'user-010',
        userName: 'Engineer J',
        email: 'engineer-j@company.com',
        teamId: teamId,
      },
    ];

    const mockSubmissions = mockTeamMembers.map((member) => ({
      userId: member.userId,
      teamId: teamId,
      reportDate: reportDate,
      submissionTimestamp: new Date('2024-01-15T08:00:00Z'),
      isOnTime: true,
      yesterdayAccomplishments: 'Completed task X',
      todayPlans: 'Working on task Y',
      challenges: 'Challenge Z',
    }));

    const mockReportSubmissionStatuses = mockSubmissions.map((submission) => ({
      userId: submission.userId,
      reportDate: submission.reportDate,
      submissionTimestamp: submission.submissionTimestamp,
      isOnTime: submission.isOnTime,
      delayMinutes: 0,
      recordedAt: new Date('2024-01-15T08:05:00Z'),
      notificationSent: false,
    }));

    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(
      input,
      {
        fetchTeamMembers: async () => mockTeamMembers,
        fetchReportSubmissionStatuses: async () => mockReportSubmissionStatuses,
      }
    );

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(10);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(100.0);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.aggregatedAt).toBeDefined();
  });
});