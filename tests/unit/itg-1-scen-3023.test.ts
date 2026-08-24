import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Real-time Dashboard Display', () => {
  // SCEN-3023: [normal] 報告提出状況リアルタイム表示機能 - チームメンバー10名中1名だけ未提出の場合、未提出メンバーが1名正確に識別される
  test('should accurately identify exactly 1 unsubmitted member out of 10 team members in real-time dashboard', () => {
    // Arrange: Setup test data with 10 team members, 9 submitted and 1 unsubmitted
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    // Mock team member data: 9 submitted, 1 unsubmitted
    const submittedMembers = [
      {
        userId: 'user-001',
        userName: 'Alice Johnson',
        email: 'alice@company.com',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
      {
        userId: 'user-002',
        userName: 'Bob Smith',
        email: 'bob@company.com',
        submittedAt: new Date('2024-01-15T08:45:00Z'),
      },
      {
        userId: 'user-003',
        userName: 'Carol Davis',
        email: 'carol@company.com',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
      },
      {
        userId: 'user-004',
        userName: 'David Wilson',
        email: 'david@company.com',
        submittedAt: new Date('2024-01-15T09:15:00Z'),
      },
      {
        userId: 'user-005',
        userName: 'Eve Martinez',
        email: 'eve@company.com',
        submittedAt: new Date('2024-01-15T09:30:00Z'),
      },
      {
        userId: 'user-006',
        userName: 'Frank Brown',
        email: 'frank@company.com',
        submittedAt: new Date('2024-01-15T09:45:00Z'),
      },
      {
        userId: 'user-007',
        userName: 'Grace Lee',
        email: 'grace@company.com',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        userId: 'user-008',
        userName: 'Henry Taylor',
        email: 'henry@company.com',
        submittedAt: new Date('2024-01-15T10:15:00Z'),
      },
      {
        userId: 'user-009',
        userName: 'Isabel Garcia',
        email: 'isabel@company.com',
        submittedAt: new Date('2024-01-15T10:30:00Z'),
      },
    ];

    const unsubmittedMembers = [
      {
        userId: 'user-010',
        userName: 'Jack Robinson',
        email: 'jack@company.com',
      },
    ];

    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Act: Call aggregateReportSubmissionStatus
    const result = aggregateReportSubmissionStatus(
      input,
      submittedMembers,
      unsubmittedMembers,
    );

    // Assert: Verify real-time dashboard display accuracy
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(9);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);

    // Verify submission rate calculation: 9 submitted / 10 total = 90.0%
    expect(result.submissionRate).toBe(90.0);

    // Verify unsubmitted members list contains exactly 1 member
    expect(result.unsubmittedMembers).toHaveLength(1);

    // Verify unsubmitted member identification accuracy
    expect(result.unsubmittedMembers[0].userId).toBe('user-010');
    expect(result.unsubmittedMembers[0].userName).toBe('Jack Robinson');
    expect(result.unsubmittedMembers[0].email).toBe('jack@company.com');

    // Verify aggregatedAt timestamp is recorded in ISO 8601 format
    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    );

    // Verify no false positives in submission status
    expect(
      result.unsubmittedMembers.some((m) => m.userId.startsWith('user-00')),
    ).toBe(true);
    expect(
      result.unsubmittedMembers.some(
        (m) =>
          m.userName === 'Alice Johnson' ||
          m.userName === 'Bob Smith' ||
          m.userName === 'Carol Davis',
      ),
    ).toBe(false);
  });
});