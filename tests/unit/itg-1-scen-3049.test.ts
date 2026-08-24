import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況（提出済み・未提出）をリアルタイム表示し、未提出メンバーを一目で把握できる機能', () => {
  // SCEN-3049
  test('報告提出状況リアルタイム表示機能 - チーム10名中ちょうど5名が提出済みのとき、提出済み・未提出の人数がリアルタイムで正確に表示される', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    const submittedUserIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'];
    const unsubmittedUserIds = ['user-006', 'user-007', 'user-008', 'user-009', 'user-010'];

    const unsubmittedMembers = unsubmittedUserIds.map((userId, index) => ({
      userId: userId,
      userName: `Member ${String.fromCharCode(70 + index)}`,
      email: `member${String.fromCharCode(102 + index)}@company.com`,
      remainingMinutes: 45 - (index * 5),
    }));

    const aggregationResult = aggregateReportSubmissionStatus({
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    });

    expect(aggregationResult).toBeDefined();
    expect(aggregationResult.teamId).toBe(teamId);
    expect(aggregationResult.reportDate).toBe(reportDate);
    expect(aggregationResult.totalMembers).toBe(10);
    expect(aggregationResult.submittedCount).toBe(5);
    expect(aggregationResult.unsubmittedCount).toBe(5);
    expect(aggregationResult.submissionRate).toBe(50.0);
    expect(aggregationResult.delayedSubmissionCount).toBe(0);
    expect(aggregationResult.unsubmittedMembers).toHaveLength(5);
    expect(aggregationResult.unsubmittedMembers).toEqual(
      expect.arrayContaining(
        unsubmittedMembers.map((member) =>
          expect.objectContaining({
            userId: member.userId,
            userName: member.userName,
            email: member.email,
            remainingMinutes: expect.any(Number),
          })
        )
      )
    );
    expect(aggregationResult.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});