import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Timestamp Recording and Deadline Judgment', () => {
  test('SCEN-066: Multiple submissions update timestamps consistently and maintain deadline judgment', async () => {
    // Arrange
    const userId = 'test_user_001';
    const teamId = 'team_001';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'タスクA完了';
    const todayPlan = 'タスクB開始';
    const challenges = '課題1';

    const firstSubmissionTime = new Date('2024-01-15T08:30:00Z');
    const secondSubmissionTime = new Date('2024-01-15T08:35:00Z');
    const thirdSubmissionTime = new Date('2024-01-15T08:40:00Z');

    const firstSubmissionInput = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
      submissionTimestamp: firstSubmissionTime,
    };

    const secondSubmissionInput = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
      submissionTimestamp: secondSubmissionTime,
    };

    const thirdSubmissionInput = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
      submissionTimestamp: thirdSubmissionTime,
    };

    // Act - First submission
    const firstSubmissionResult = await submitDailyReport(firstSubmissionInput);

    // Assert - First submission
    expect(firstSubmissionResult.reportId).toBeDefined();
    expect(firstSubmissionResult.reportId).toMatch(/^report_/);
    expect(firstSubmissionResult.submissionTimestamp).toBe('2024-01-15T08:30:00Z');
    expect(typeof firstSubmissionResult.isWithinDeadline).toBe('boolean');
    const firstTimestamp = new Date(firstSubmissionResult.submissionTimestamp).getTime();
    const firstDeadlineFlag = firstSubmissionResult.isWithinDeadline;
    const firstReportId = firstSubmissionResult.reportId;

    // Act - Second submission
    const secondSubmissionResult = await submitDailyReport(secondSubmissionInput);

    // Assert - Second submission
    expect(secondSubmissionResult.reportId).toBe(firstReportId);
    expect(secondSubmissionResult.submissionTimestamp).toBe('2024-01-15T08:35:00Z');
    expect(secondSubmissionResult.isWithinDeadline).toBe(firstDeadlineFlag);
    const secondTimestamp = new Date(secondSubmissionResult.submissionTimestamp).getTime();
    expect(secondTimestamp).toBeGreaterThan(firstTimestamp);

    // Act - Third submission
    const thirdSubmissionResult = await submitDailyReport(thirdSubmissionInput);

    // Assert - Third submission
    expect(thirdSubmissionResult.reportId).toBe(firstReportId);
    expect(thirdSubmissionResult.submissionTimestamp).toBe('2024-01-15T08:40:00Z');
    expect(thirdSubmissionResult.isWithinDeadline).toBe(firstDeadlineFlag);
    const thirdTimestamp = new Date(thirdSubmissionResult.submissionTimestamp).getTime();
    expect(thirdTimestamp).toBeGreaterThan(secondTimestamp);

    // Verify timestamp ordering
    expect(firstTimestamp < secondTimestamp && secondTimestamp < thirdTimestamp).toBe(true);

    // Verify consistent deadline judgment across all submissions
    expect(firstSubmissionResult.isWithinDeadline).toBe(secondSubmissionResult.isWithinDeadline);
    expect(secondSubmissionResult.isWithinDeadline).toBe(thirdSubmissionResult.isWithinDeadline);
  });
});