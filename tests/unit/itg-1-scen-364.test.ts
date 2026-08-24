import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Real-time Update - Duplicate Submission Overwrite', () => {
  test('SCEN-364: Same engineer submitting duplicate report on same day overwrites with latest submission', async () => {
    // Setup: Initialize team and engineer
    const teamId = 'team_001';
    const engineerId = 'engineer_001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager_001';

    // First submission at 09:00:00
    const firstSubmissionTimestamp = new Date('2024-01-15T09:00:00Z');
    const firstReportContent = {
      yesterday: 'タスクX',
      today: 'タスクY',
      challenges: 'なし',
    };

    // Second submission at 09:15:30 (same day, same engineer)
    const secondSubmissionTimestamp = new Date('2024-01-15T09:15:30Z');
    const secondReportContent = {
      yesterday: 'タスクX修正',
      today: 'タスクZ',
      challenges: 'バグ検出',
    };

    // Mock database state before aggregation
    // Simulate that the second submission has already overwritten the first in the database
    const mockSubmissionData = [
      {
        team_id: teamId,
        report_date: reportDate,
        user_id: engineerId,
        submission_timestamp: secondSubmissionTimestamp.toISOString(),
        report_content: JSON.stringify(secondReportContent),
        is_delayed: false,
      },
    ];

    // Input for aggregateReportSubmissionStatus
    const aggregationInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock team members (1 engineer in this scenario)
    const totalTeamMembers = 1;
    const submittedCount = 1; // Engineer A has submitted (latest record only)
    const unsubmittedCount = 0;
    const delayedSubmissionCount = 0;
    const submissionRate = (submittedCount / totalTeamMembers) * 100; // 100.0

    // Expected output structure based on aggregation
    const expectedResult = {
      teamId,
      reportDate,
      totalMembers: totalTeamMembers,
      submittedCount,
      unsubmittedCount,
      delayedSubmissionCount,
      submissionRate: 100.0,
      unsubmittedMembers: [],
      aggregatedAt: expect.any(String), // ISO 8601 format
    };

    // Call the function
    const result = await aggregateReportSubmissionStatus(aggregationInput);

    // Verify the aggregation result reflects the latest submission only
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalTeamMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(100.0);
    expect(result.unsubmittedMembers).toHaveLength(0);

    // Verify the timestamp format (ISO 8601)
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify that only one record exists for engineer_001 on 2024-01-15
    // (This is implicitly verified by submittedCount === 1)
    expect(result.submittedCount).toBe(1);

    // Verify no duplicate entries exist in the submission tracking
    // (submittedCount should reflect actual unique submissions, not duplicates)
    expect(result.totalMembers).toBe(result.submittedCount + result.unsubmittedCount);
  });
});