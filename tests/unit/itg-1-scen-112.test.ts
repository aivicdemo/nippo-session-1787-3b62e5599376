import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-112
  test('全10名のメンバーが報告送信完了した時点で、提出済み一覧に全員が表示される', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-manager-001';

    const memberIds = Array.from({ length: 10 }, (_, i) => `user-member-${String(i + 1).padStart(2, '0')}`);
    const memberNames = Array.from({ length: 10 }, (_, i) => `メンバー${i + 1}`);
    const memberEmails = Array.from({ length: 10 }, (_, i) => `member${i + 1}@example.com`);

    const submissionTimestamps = Array.from({ length: 10 }, (_, i) => {
      const minutes = i * 5;
      const date = new Date('2024-01-15T09:00:00Z');
      date.setMinutes(date.getMinutes() + minutes);
      return date.toISOString();
    });

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      input,
      {
        getTeamMemberCount: async (tId: string) => {
          return tId === teamId ? 10 : 0;
        },
        getSubmittedMembers: async (tId: string, rDate: string) => {
          if (tId === teamId && rDate === reportDate) {
            return memberIds.map((memberId, index) => ({
              userId: memberId,
              userName: memberNames[index],
              email: memberEmails[index],
              submittedAt: submissionTimestamps[index],
            }));
          }
          return [];
        },
        getUnsubmittedMembers: async (tId: string, rDate: string) => {
          if (tId === teamId && rDate === reportDate) {
            return [];
          }
          return [];
        },
        getReportDeadline: async (tId: string, rDate: string) => {
          if (tId === teamId && rDate === reportDate) {
            return new Date('2024-01-15T10:00:00Z');
          }
          return new Date();
        },
        canUserAccessTeam: async (uId: string, tId: string) => {
          return tId === teamId;
        },
      },
    );

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(10);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(100.0);

    expect(result.unsubmittedMembers).toHaveLength(0);

    expect(result.aggregatedAt).toBeTruthy();
    expect(typeof result.aggregatedAt).toBe('string');

    const parsedAggregatedAt = new Date(result.aggregatedAt);
    expect(parsedAggregatedAt instanceof Date && !isNaN(parsedAggregatedAt.getTime())).toBe(true);
  });
});