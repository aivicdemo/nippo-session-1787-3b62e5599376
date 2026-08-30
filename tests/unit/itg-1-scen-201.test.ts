import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - getSubmissionStatus', () => {
  // SCEN-201: [normal] 指定日付のチーム全体の報告提出状況を集計し、提出済み・未提出メンバーと提出時刻を返す
  test('should aggregate team submission status with 5 submitted and 5 unsubmitted members', async () => {
    const teamId = 'team-001';
    const reportDate = '2026-08-20';
    const requesterId = 'user-manager-001';

    const teamMemberIds = [
      'member-001',
      'member-002',
      'member-003',
      'member-004',
      'member-005',
      'member-006',
      'member-007',
      'member-008',
      'member-009',
      'member-010',
    ];

    const submittedMemberData = [
      {
        memberId: 'member-001',
        memberName: 'Engineer A',
        submittedAt: '2026-08-20T08:15:00Z',
        isLate: false,
      },
      {
        memberId: 'member-003',
        memberName: 'Engineer C',
        submittedAt: '2026-08-20T08:20:00Z',
        isLate: false,
      },
      {
        memberId: 'member-005',
        memberName: 'Engineer E',
        submittedAt: '2026-08-20T08:25:00Z',
        isLate: false,
      },
      {
        memberId: 'member-007',
        memberName: 'Engineer G',
        submittedAt: '2026-08-20T08:30:00Z',
        isLate: false,
      },
      {
        memberId: 'member-009',
        memberName: 'Engineer I',
        submittedAt: '2026-08-20T08:35:00Z',
        isLate: false,
      },
    ];

    const unsubmittedMemberData = [
      {
        memberId: 'member-002',
        memberName: 'Engineer B',
        remainingMinutes: 25,
        promptPriority: 'high',
      },
      {
        memberId: 'member-004',
        memberName: 'Engineer D',
        remainingMinutes: 25,
        promptPriority: 'high',
      },
      {
        memberId: 'member-006',
        memberName: 'Engineer F',
        remainingMinutes: 25,
        promptPriority: 'high',
      },
      {
        memberId: 'member-008',
        memberName: 'Engineer H',
        remainingMinutes: 25,
        promptPriority: 'high',
      },
      {
        memberId: 'member-010',
        memberName: 'Engineer J',
        remainingMinutes: 25,
        promptPriority: 'high',
      },
    ];

    // Mock dependencies
    jest.mock('../../src/logic/report-submission-management', () => ({
      getSubmissionStatus: jest.fn().mockResolvedValue({
        teamId: 'team-001',
        reportDate: '2026-08-20',
        submittedCount: 5,
        unsubmittedCount: 5,
        submittedMembers: submittedMemberData,
        unsubmittedMembers: unsubmittedMemberData,
        aggregatedAt: '2026-08-20T08:40:00Z',
      }),
    }));

    const result = await getSubmissionStatus(teamId, reportDate, requesterId);

    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2026-08-20');
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);
    expect(result.submittedMembers).toHaveLength(5);
    expect(result.unsubmittedMembers).toHaveLength(5);

    expect(result.submittedMembers[0]).toEqual({
      memberId: 'member-001',
      memberName: 'Engineer A',
      submittedAt: '2026-08-20T08:15:00Z',
      isLate: false,
    });

    expect(result.submittedMembers[1]).toEqual({
      memberId: 'member-003',
      memberName: 'Engineer C',
      submittedAt: '2026-08-20T08:20:00Z',
      isLate: false,
    });

    expect(result.submittedMembers[2]).toEqual({
      memberId: 'member-005',
      memberName: 'Engineer E',
      submittedAt: '2026-08-20T08:25:00Z',
      isLate: false,
    });

    expect(result.submittedMembers[3]).toEqual({
      memberId: 'member-007',
      memberName: 'Engineer G',
      submittedAt: '2026-08-20T08:30:00Z',
      isLate: false,
    });

    expect(result.submittedMembers[4]).toEqual({
      memberId: 'member-009',
      memberName: 'Engineer I',
      submittedAt: '2026-08-20T08:35:00Z',
      isLate: false,
    });

    expect(result.unsubmittedMembers[0]).toEqual({
      memberId: 'member-002',
      memberName: 'Engineer B',
      remainingMinutes: 25,
      promptPriority: 'high',
    });

    expect(result.unsubmittedMembers[1]).toEqual({
      memberId: 'member-004',
      memberName: 'Engineer D',
      remainingMinutes: 25,
      promptPriority: 'high',
    });

    expect(result.unsubmittedMembers[2]).toEqual({
      memberId: 'member-006',
      memberName: 'Engineer F',
      remainingMinutes: 25,
      promptPriority: 'high',
    });

    expect(result.unsubmittedMembers[3]).toEqual({
      memberId: 'member-008',
      memberName: 'Engineer H',
      remainingMinutes: 25,
      promptPriority: 'high',
    });

    expect(result.unsubmittedMembers[4]).toEqual({
      memberId: 'member-010',
      memberName: 'Engineer J',
      remainingMinutes: 25,
      promptPriority: 'high',
    });

    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});