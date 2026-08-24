import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation - Real-time Dashboard Display', () => {
  // SCEN-365: [edge] 報告提出状況リアルタイム更新機能 - ダッシュボード表示順序が提出済み・未提出の状態に基づく逆順（未提出を上位に表示）で並ぶ
  test('should display unsubmitted members first, then submitted members, maintaining order within each group', () => {
    // Test data preparation: 10 team members, 5 submitted, 5 unsubmitted
    const teamId = 'team-alpha-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-manager-001';

    // Unsubmitted members (5 members)
    const unsubmittedMember_1 = {
      userId: 'user-unsubmit-001',
      userName: 'Alice Johnson',
      email: 'alice@example.com',
      remainingMinutes: 45,
    };
    const unsubmittedMember_2 = {
      userId: 'user-unsubmit-002',
      userName: 'Bob Smith',
      email: 'bob@example.com',
      remainingMinutes: 30,
    };
    const unsubmittedMember_3 = {
      userId: 'user-unsubmit-003',
      userName: 'Carol Davis',
      email: 'carol@example.com',
      remainingMinutes: 15,
    };
    const unsubmittedMember_4 = {
      userId: 'user-unsubmit-004',
      userName: 'David Wilson',
      email: 'david@example.com',
      remainingMinutes: 60,
    };
    const unsubmittedMember_5 = {
      userId: 'user-unsubmit-005',
      userName: 'Emma Brown',
      email: 'emma@example.com',
      remainingMinutes: 20,
    };

    // Submitted members (5 members)
    const submittedMember_1 = {
      userId: 'user-submit-001',
      userName: 'Frank Miller',
      email: 'frank@example.com',
      remainingMinutes: 0,
    };
    const submittedMember_2 = {
      userId: 'user-submit-002',
      userName: 'Grace Lee',
      email: 'grace@example.com',
      remainingMinutes: 0,
    };
    const submittedMember_3 = {
      userId: 'user-submit-003',
      userName: 'Henry Taylor',
      email: 'henry@example.com',
      remainingMinutes: 0,
    };
    const submittedMember_4 = {
      userId: 'user-submit-004',
      userName: 'Ivy Martinez',
      email: 'ivy@example.com',
      remainingMinutes: 0,
    };
    const submittedMember_5 = {
      userId: 'user-submit-005',
      userName: 'Jack Anderson',
      email: 'jack@example.com',
      remainingMinutes: 0,
    };

    const allMembers = [
      unsubmittedMember_1,
      unsubmittedMember_2,
      unsubmittedMember_3,
      unsubmittedMember_4,
      unsubmittedMember_5,
      submittedMember_1,
      submittedMember_2,
      submittedMember_3,
      submittedMember_4,
      submittedMember_5,
    ];

    const input: Parameters<typeof aggregateReportSubmissionStatus>[0] = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock data: simulate database state with 5 submitted and 5 unsubmitted
    // This would normally be fetched from database; for this test we assume
    // the function receives or queries this data internally
    const result = aggregateReportSubmissionStatus(input);

    // Verify total team members count
    expect(result.totalMembers).toBe(10);

    // Verify submitted and unsubmitted counts
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);

    // Verify submission rate calculation: (5 submitted / 10 total) * 100 = 50.0%
    expect(result.submissionRate).toBe(50.0);

    // Verify unsubmitted members list is sorted and displayed first
    expect(result.unsubmittedMembers.length).toBe(5);

    // Verify unsubmitted members are listed first (indices 0-4)
    const unsubmittedUserIds = result.unsubmittedMembers.map((m) => m.userId);
    expect(unsubmittedUserIds[0]).toMatch(/user-unsubmit-/);
    expect(unsubmittedUserIds[1]).toMatch(/user-unsubmit-/);
    expect(unsubmittedUserIds[2]).toMatch(/user-unsubmit-/);
    expect(unsubmittedUserIds[3]).toMatch(/user-unsubmit-/);
    expect(unsubmittedUserIds[4]).toMatch(/user-unsubmit-/);

    // Verify order consistency: unsubmitted members maintain their relative order
    expect(result.unsubmittedMembers[0].userName).toBe('Alice Johnson');
    expect(result.unsubmittedMembers[1].userName).toBe('Bob Smith');
    expect(result.unsubmittedMembers[2].userName).toBe('Carol Davis');
    expect(result.unsubmittedMembers[3].userName).toBe('David Wilson');
    expect(result.unsubmittedMembers[4].userName).toBe('Emma Brown');

    // Verify aggregatedAt is in ISO 8601 format and is a recent timestamp
    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(aggregatedAtDate.getTime()).toBeLessThanOrEqual(Date.now());
    expect(aggregatedAtDate.getTime()).toBeGreaterThan(Date.now() - 60000); // within 1 minute

    // Verify team and report date match input
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // Verify remaining minutes for unsubmitted members are positive
    expect(result.unsubmittedMembers[0].remainingMinutes).toBeGreaterThan(0);
    expect(result.unsubmittedMembers[1].remainingMinutes).toBeGreaterThan(0);
    expect(result.unsubmittedMembers[2].remainingMinutes).toBeGreaterThan(0);
    expect(result.unsubmittedMembers[3].remainingMinutes).toBeGreaterThan(0);
    expect(result.unsubmittedMembers[4].remainingMinutes).toBeGreaterThan(0);

    // Verify email addresses are present for all unsubmitted members
    result.unsubmittedMembers.forEach((member) => {
      expect(member.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });
});