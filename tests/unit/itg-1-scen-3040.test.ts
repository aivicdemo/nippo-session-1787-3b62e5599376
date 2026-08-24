import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('aggregateReportSubmissionStatus - Team Member Master Data Error', () => {
  // SCEN-3040
  test('should throw ERR_TEAM_MEMBER_NOT_FOUND when team has no valid members in master data', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-eiga-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/ERR_TEAM_MEMBER_NOT_FOUND/);
  });
});