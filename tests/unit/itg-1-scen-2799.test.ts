import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Real-time Display', () => {
  // SCEN-2799: [edge] 報告提出状況リアルタイム表示機能 - 開始日と終了日が同日の場合、報告提出状況が正確に表示される
  test('should display accurate submission status when start date and end date are the same day', async () => {
    // Arrange
    const target_date = '2026-08-19';
    const team_id = 'team-001';
    const request_user_id = 'manager-001';

    const mock_users = [
      { userId: 'user-001', userName: 'Member A', email: 'a@example.com', teamId: team_id },
      { userId: 'user-002', userName: 'Member B', email: 'b@example.com', teamId: team_id },
      { userId: 'user-003', userName: 'Member C', email: 'c@example.com', teamId: team_id },
      { userId: 'user-004', userName: 'Member D', email: 'd@example.com', teamId: team_id },
      { userId: 'user-005', userName: 'Member E', email: 'e@example.com', teamId: team_id },
      { userId: 'user-006', userName: 'Member F', email: 'f@example.com', teamId: team_id },
      { userId: 'user-007', userName: 'Member G', email: 'g@example.com', teamId: team_id },
      { userId: 'user-008', userName: 'Member H', email: 'h@example.com', teamId: team_id },
      { userId: 'user-009', userName: 'Member I', email: 'i@example.com', teamId: team_id },
      { userId: 'user-010', userName: 'Member J', email: 'j@example.com', teamId: team_id },
    ];

    const mock_submissions = [
      { userId: 'user-001', submissionTimestamp: new Date('2026-08-19T08:30:00Z'), isOnTime: true },
      { userId: 'user-002', submissionTimestamp: new Date('2026-08-19T08:45:00Z'), isOnTime: true },
      { userId: 'user-003', submissionTimestamp: new Date('2026-08-19T09:00:00Z'), isOnTime: true },
    ];

    const mock_deadline = new Date('2026-08-19T09:30:00Z');

    const mock_user_repo = {
      findTeamMembers: jest.fn().mockResolvedValue(mock_users),
      getUser: jest.fn().mockImplementation((userId: string) =>
        Promise.resolve(mock_users.find(u => u.userId === userId))
      ),
    };

    const mock_submission_repo = {
      getSubmissionsByTeamAndDate: jest.fn().mockResolvedValue(mock_submissions),
    };

    const mock_deadline_repo = {
      getDeadlineForDate: jest.fn().mockResolvedValue(mock_deadline),
    };

    const input = {
      teamId: team_id,
      reportDate: target_date,
      requestUserId: request_user_id,
      includeDelayedSubmissions: true,
    };

    // Act
    const result = await aggregateReportSubmissionStatus(
      input,
      {
        userRepository: mock_user_repo,
        submissionRepository: mock_submission_repo,
        deadlineRepository: mock_deadline_repo,
      }
    );

    // Assert - Core metrics
    expect(result.teamId).toBe(team_id);
    expect(result.reportDate).toBe(target_date);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(3);
    expect(result.unsubmittedCount).toBe(7);
    expect(result.delayedSubmissionCount).toBe(0);

    // Assert - Submission rate calculation: (3 / 10) * 100 = 30.0
    expect(result.submissionRate).toBe(30.0);

    // Assert - Unsubmitted members list
    expect(result.unsubmittedMembers).toHaveLength(7);
    expect(result.unsubmittedMembers[0]).toMatchObject({
      userId: 'user-004',
      userName: 'Member D',
      email: 'd@example.com',
    });
    expect(result.unsubmittedMembers[6]).toMatchObject({
      userId: 'user-010',
      userName: 'Member J',
      email: 'j@example.com',
    });

    // Assert - Remaining time calculation (negative means overdue)
    result.unsubmittedMembers.forEach((member) => {
      expect(typeof member.remainingMinutes).toBe('number');
    });

    // Assert - Aggregation timestamp is ISO 8601 format
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});