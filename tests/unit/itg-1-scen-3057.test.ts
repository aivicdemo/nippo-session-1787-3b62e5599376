import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-3057
  test('朝7時30分直後にダッシュボード表示トリガーが発火したとき、本日の報告提出状況がリアルタイム表示される', () => {
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';
    const aggregatedAtExpected = new Date('2024-01-15T07:30:01Z');

    const unsubmittedMembersExpected = [
      {
        userId: 'user-eng-006',
        userName: 'Engineer F',
        email: 'engineer.f@company.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-eng-007',
        userName: 'Engineer G',
        email: 'engineer.g@company.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-eng-008',
        userName: 'Engineer H',
        email: 'engineer.h@company.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-eng-009',
        userName: 'Engineer I',
        email: 'engineer.i@company.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-eng-010',
        userName: 'Engineer J',
        email: 'engineer.j@company.com',
        remainingMinutes: 30,
      },
    ];

    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(50.0);
    expect(result.unsubmittedMembers).toHaveLength(5);
    expect(result.unsubmittedMembers).toEqual(
      expect.arrayContaining(
        unsubmittedMembersExpected.map(member => ({
          userId: expect.any(String),
          userName: expect.any(String),
          email: expect.any(String),
          remainingMinutes: expect.any(Number),
        }))
      )
    );
    expect(new Date(result.aggregatedAt).getTime()).toBeGreaterThanOrEqual(
      aggregatedAtExpected.getTime()
    );
  });
});