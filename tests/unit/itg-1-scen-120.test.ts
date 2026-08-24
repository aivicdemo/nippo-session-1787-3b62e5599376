import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('提出状況リアルタイム表示機能', () => {
  test('SCEN-120: 同じメンバーが複数回の報告送信を行った場合、最新の1件のみが提出済みとしてカウントされる', () => {
    // Arrange
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';
    const memberAUserId = 'member-a-001';
    const memberBUserId = 'member-b-001';
    const memberCUserId = 'member-c-001';

    // Mock submissions data: member-a has 2 submissions, member-b has 1, member-c has 0
    // First submission from member-a (older, should be marked as not current)
    const firstSubmissionFromMemberA = {
      userId: memberAUserId,
      teamId: teamId,
      reportDate: reportDate,
      yesterdayContent: 'タスクA完了',
      todayContent: 'タスクB開始',
      issueContent: '課題1',
      submittedAt: new Date('2024-01-15T08:00:00Z'),
      currentSubmission: false,
    };

    // Second submission from member-a (latest, should be marked as current)
    const secondSubmissionFromMemberA = {
      userId: memberAUserId,
      teamId: teamId,
      reportDate: reportDate,
      yesterdayContent: 'タスクA完了、修正対応',
      todayContent: 'タスクC対応',
      issueContent: '課題1、課題2',
      submittedAt: new Date('2024-01-15T08:15:00Z'),
      currentSubmission: true,
    };

    // Submission from member-b (on time)
    const submissionFromMemberB = {
      userId: memberBUserId,
      teamId: teamId,
      reportDate: reportDate,
      yesterdayContent: 'タスクD完了',
      todayContent: 'タスクE開始',
      issueContent: '課題3',
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      currentSubmission: true,
    };

    // Member-c has no submission (unsubmitted)
    const allSubmissions = [
      firstSubmissionFromMemberA,
      secondSubmissionFromMemberA,
      submissionFromMemberB,
    ];

    // Mock the database context
    const mockDatabaseContext = {
      submissions: allSubmissions,
      teamMembers: [
        { userId: memberAUserId, teamId: teamId, userName: 'Member A', email: 'a@example.com' },
        { userId: memberBUserId, teamId: teamId, userName: 'Member B', email: 'b@example.com' },
        { userId: memberCUserId, teamId: teamId, userName: 'Member C', email: 'c@example.com' },
      ],
      getSubmissionsForTeam: (tid: string, date: string) =>
        allSubmissions.filter((s) => s.teamId === tid && s.reportDate === date),
      getTeamMembers: (tid: string) =>
        mockDatabaseContext.teamMembers.filter((m) => m.teamId === tid),
    };

    // Act
    const input = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input, mockDatabaseContext);

    // Assert
    // 1. Total members count should be 3
    expect(result.totalMembers).toBe(3);

    // 2. Submitted count should be 2 (member-a with latest submission + member-b)
    expect(result.submittedCount).toBe(2);

    // 3. Unsubmitted count should be 1 (member-c)
    expect(result.unsubmittedCount).toBe(1);

    // 4. Delayed submission count should be 0 (all within time)
    expect(result.delayedSubmissionCount).toBe(0);

    // 5. Submission rate should be 66.7% (2 out of 3)
    expect(result.submissionRate).toBe(66.7);

    // 6. Team ID and report date should match input
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // 7. Unsubmitted members should contain only member-c
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe(memberCUserId);
    expect(result.unsubmittedMembers[0].userName).toBe('Member C');
    expect(result.unsubmittedMembers[0].email).toBe('c@example.com');

    // 8. Member-a should have the latest submission content visible
    // Verify by checking that the submission marked as current is the second one
    const currentSubmissionForMemberA = allSubmissions.find(
      (s) => s.userId === memberAUserId && s.currentSubmission === true,
    );
    expect(currentSubmissionForMemberA?.yesterdayContent).toBe('タスクA完了、修正対応');
    expect(currentSubmissionForMemberA?.todayContent).toBe('タスクC対応');
    expect(currentSubmissionForMemberA?.issueContent).toBe('課題1、課題2');

    // 9. First submission from member-a should be marked as not current
    const oldSubmissionForMemberA = allSubmissions.find(
      (s) => s.userId === memberAUserId && s.currentSubmission === false,
    );
    expect(oldSubmissionForMemberA?.yesterdayContent).toBe('タスクA完了');
    expect(oldSubmissionForMemberA?.todayContent).toBe('タスクB開始');
    expect(oldSubmissionForMemberA?.issueContent).toBe('課題1');

    // 10. All submissions for member-a should exist in data (2 records)
    const memberASubmissions = allSubmissions.filter((s) => s.userId === memberAUserId);
    expect(memberASubmissions).toHaveLength(2);

    // 11. Aggregated at should be a valid ISO 8601 timestamp
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});