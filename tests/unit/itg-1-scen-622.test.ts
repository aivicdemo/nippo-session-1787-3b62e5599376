import { getSubmissionStatus } from '../../src/logic/report-submission-management';
import { type SubmissionStatusResult, type UnsubmittedMemberInfo } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 報告提出状況管理', () => {
  // SCEN-622: [edge] 指定日付のチーム全体の報告提出状況を集計し、提出済み・未提出メンバーと提出時刻を返す - メンバーの遅延履歴データが取得できないときという明示された境界条件で遅延リスク度合いは低リスクとして扱います
  test('should treat member as low-risk when delay history data is unavailable', async () => {
    // Arrange
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requesterId = 'requester-001';
    const currentTime = new Date('2024-01-15T08:45:00Z');
    const reportDeadline = new Date('2024-01-15T09:00:00Z');

    // Mock the database calls to simulate unavailable delay history
    const memberAId = 'A';
    const memberBId = 'B';
    const memberPriorityRankMap = new Map<string, number>([
      [memberBId, 1] // Only memberB has history; memberA has no history
    ]);

    // Mock team members
    const teamMembers = [
      { memberId: memberAId, memberName: 'Member A', reportStatus: 'pending' as const },
      { memberId: memberBId, memberName: 'Member B', reportStatus: 'submitted' as const, submissionTime: new Date('2024-01-15T08:30:00Z') }
    ];

    // Mock the data retrieval (simulating the unavailable scenario)
    // This test assumes getSubmissionStatus internally calls a method that retrieves memberPriorityRankMap
    // When memberA is not in the map, lateCount defaults to 0, resulting in 'low' risk level

    // Act
    const result: SubmissionStatusResult = await getSubmissionStatus(
      teamId,
      reportDate,
      requesterId
    );

    // Assert - Verify structure and values
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.submittedCount).toBe(1);
    expect(result.unsubmittedCount).toBe(1);

    // Verify unsubmitted members contain memberA
    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.unsubmittedMembers.length).toBe(1);

    // Verify memberA details
    const memberAUnsubmitted = result.unsubmittedMembers.find(m => m.memberId === memberAId);
    expect(memberAUnsubmitted).toBeDefined();
    expect(memberAUnsubmitted?.memberId).toBe(memberAId);
    expect(memberAUnsubmitted?.memberName).toBe('Member A');

    // Verify delayRiskLevel is 'low' when history data is unavailable
    expect(memberAUnsubmitted?.delayRiskLevel).toBe('low');

    // Verify recommendedPromptMethod is 'email' for low risk
    expect(memberAUnsubmitted?.recommendedPromptMethod).toBe('email');

    // Verify remaining time calculation (deadline is 15 minutes from current time)
    const expectedRemainingMinutes = 15;
    expect(memberAUnsubmitted?.remainingMinutes).toBe(expectedRemainingMinutes);

    // Verify submitted members
    expect(result.submittedMembers).toBeDefined();
    expect(result.submittedMembers.length).toBe(1);
    const memberBSubmitted = result.submittedMembers.find(m => m.memberId === memberBId);
    expect(memberBSubmitted).toBeDefined();
    expect(memberBSubmitted?.memberId).toBe(memberBId);
    expect(memberBSubmitted?.memberName).toBe('Member B');
    expect(memberBSubmitted?.submittedAt).toBe('2024-01-15T08:30:00Z');
    expect(memberBSubmitted?.isLate).toBe(false);

    // Verify aggregatedAt is in ISO 8601 format and represents current time
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});