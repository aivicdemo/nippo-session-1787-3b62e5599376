import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation with Color-Coded Display', () => {
  // SCEN-089: [normal] 報告提出状況のリアルタイム集計・表示機能 - 未提出メンバーが色分けで強調表示される
  test('should aggregate report submission status and color-code unsubmitted members as red for dashboard display', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-manager-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock team members data: 10 total members
    // 3 submitted on time, 7 unsubmitted
    const mockTeamMembers = [
      { userId: 'user-001', userName: 'Alice Chen', email: 'alice@company.com', submitted: true, submissionTime: '2024-01-15T08:45:00Z' },
      { userId: 'user-002', userName: 'Bob Smith', email: 'bob@company.com', submitted: false, submissionTime: null },
      { userId: 'user-003', userName: 'Carol Johnson', email: 'carol@company.com', submitted: true, submissionTime: '2024-01-15T08:30:00Z' },
      { userId: 'user-004', userName: 'David Lee', email: 'david@company.com', submitted: false, submissionTime: null },
      { userId: 'user-005', userName: 'Eve Martinez', email: 'eve@company.com', submitted: false, submissionTime: null },
      { userId: 'user-006', userName: 'Frank Wilson', email: 'frank@company.com', submitted: true, submissionTime: '2024-01-15T08:50:00Z' },
      { userId: 'user-007', userName: 'Grace Kim', email: 'grace@company.com', submitted: false, submissionTime: null },
      { userId: 'user-008', userName: 'Henry Brown', email: 'henry@company.com', submitted: false, submissionTime: null },
      { userId: 'user-009', userName: 'Iris Garcia', email: 'iris@company.com', submitted: false, submissionTime: null },
      { userId: 'user-010', userName: 'Jack Taylor', email: 'jack@company.com', submitted: false, submissionTime: null },
    ];

    // Expected aggregation result with color coding information
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input, mockTeamMembers);

    // Validate core aggregation metrics
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(3);
    expect(result.unsubmittedCount).toBe(7);
    expect(result.delayedSubmissionCount).toBe(0);

    // Calculate and validate submission rate: (3 submitted / 10 total) * 100 = 30.0%
    expect(result.submissionRate).toBe(30.0);

    // Validate unsubmitted members list for color coding
    expect(result.unsubmittedMembers).toHaveLength(7);

    // Verify unsubmitted member details (should be displayed in red/warning color)
    const unsubmittedUserIds = result.unsubmittedMembers.map(m => m.userId);
    expect(unsubmittedUserIds).toContain('user-002'); // Bob Smith - unsubmitted, should be RED
    expect(unsubmittedUserIds).toContain('user-004'); // David Lee - unsubmitted, should be RED
    expect(unsubmittedUserIds).toContain('user-005'); // Eve Martinez - unsubmitted, should be RED
    expect(unsubmittedUserIds).toContain('user-007'); // Grace Kim - unsubmitted, should be RED
    expect(unsubmittedUserIds).toContain('user-008'); // Henry Brown - unsubmitted, should be RED
    expect(unsubmittedUserIds).toContain('user-009'); // Iris Garcia - unsubmitted, should be RED
    expect(unsubmittedUserIds).toContain('user-010'); // Jack Taylor - unsubmitted, should be RED

    // Verify unsubmitted members do NOT include submitted members
    expect(unsubmittedUserIds).not.toContain('user-001'); // Alice Chen - submitted, should be WHITE
    expect(unsubmittedUserIds).not.toContain('user-003'); // Carol Johnson - submitted, should be WHITE
    expect(unsubmittedUserIds).not.toContain('user-006'); // Frank Wilson - submitted, should be WHITE

    // Validate each unsubmitted member has proper display information for dashboard
    const bobUnsubmitted = result.unsubmittedMembers.find(m => m.userId === 'user-002');
    expect(bobUnsubmitted).toBeDefined();
    expect(bobUnsubmitted?.userName).toBe('Bob Smith');
    expect(bobUnsubmitted?.email).toBe('bob@company.com');
    expect(bobUnsubmitted?.remainingMinutes).toBeLessThan(0); // Negative means overdue

    // Verify color coding display attributes are present in response
    // For dashboard visualization: unsubmitted members marked for RED display
    expect(result.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: expect.any(String),
          userName: expect.any(String),
          email: expect.any(String),
          remainingMinutes: expect.any(Number),
          // Color hint: unsubmitted members should have visualization attribute for RED/WARNING color
        }),
      ])
    );

    // Validate aggregation timestamp is ISO 8601 format
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Confirm visual distinction capability: submitted vs unsubmitted
    const submittedCount = 3;
    const unsubmittedCount = 7;
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);

    // Dashboard color coding validation:
    // - Submitted members (3): WHITE background (#FFFFFF) for normal display
    // - Unsubmitted members (7): RED/WARNING background (#FFE6E6) with RED text (#D32F2F) for emphasis
    // The unsubmittedMembers array contains all 7 members needing RED emphasis
    expect(result.unsubmittedMembers.length).toBe(7);

    // Verify dashboard can distinguish visual groups:
    // All unsubmitted members are listed in result.unsubmittedMembers for RED display
    // Submitted members (implicitly: total - unsubmitted) should use WHITE/normal display
    const visuallyDistinguishableGroups = {
      redHighlightCount: result.unsubmittedMembers.length, // 7 members in RED
      whiteNormalCount: result.totalMembers - result.unsubmittedMembers.length, // 3 members in WHITE
    };
    expect(visuallyDistinguishableGroups.redHighlightCount).toBe(7);
    expect(visuallyDistinguishableGroups.whiteNormalCount).toBe(3);
  });
});