import { getSubmissionStatus } from '../../src/logic/report-submission-management';
import { type SubmissionStatusResult, type SubmittedMemberInfo, type UnsubmittedMemberInfo } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 報告提出状況集計', () => {
  // SCEN-619: [normal] 指定日付のチーム全体の報告提出状況を集計し、提出済み・未提出メンバーと提出時刻を返す
  test('getSubmissionStatus: チーム全体の提出状況を集計し、優先度順の未提出メンバーリストを返す', () => {
    // Setup: 固定時刻を使用して reproducible なテストを実現
    const currentTime = new Date('2024-01-15T07:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T08:00:00Z'); // 現在時刻の60分後
    const aggregationTime = currentTime;

    // Setup: チーム10名のメンバー情報を準備（6名提出済み、4名未提出）
    const teamMemberIds = [
      'memberId-A', // 遅延6回 → high リスク
      'memberId-B', // 遅延3回 → medium リスク
      'memberId-C', // 遅延1回 → low リスク
      'memberId-D', // 遅延0回 → low リスク
      'memberId-E', // 提出済み
      'memberId-F', // 提出済み
      'memberId-G', // 提出済み
      'memberId-H', // 提出済み
      'memberId-I', // 提出済み
      'memberId-J', // 提出済み
    ];

    // Setup: メンバー優先度ランク（過去30日の遅延回数）
    const memberDelayCount: Record<string, number> = {
      'memberId-A': 6,
      'memberId-B': 3,
      'memberId-C': 1,
      'memberId-D': 0,
    };

    // Setup: 提出済みメンバー情報（6名）
    const submittedMemberInfoList: SubmittedMemberInfo[] = [
      {
        memberId: 'memberId-E',
        memberName: 'Engineer E',
        submittedAt: '2024-01-15T07:15:00Z',
        isLate: false,
      },
      {
        memberId: 'memberId-F',
        memberName: 'Engineer F',
        submittedAt: '2024-01-15T07:20:00Z',
        isLate: false,
      },
      {
        memberId: 'memberId-G',
        memberName: 'Engineer G',
        submittedAt: '2024-01-15T07:25:00Z',
        isLate: false,
      },
      {
        memberId: 'memberId-H',
        memberName: 'Engineer H',
        submittedAt: '2024-01-15T07:30:00Z',
        isLate: false,
      },
      {
        memberId: 'memberId-I',
        memberName: 'Engineer I',
        submittedAt: '2024-01-15T07:35:00Z',
        isLate: false,
      },
      {
        memberId: 'memberId-J',
        memberName: 'Engineer J',
        submittedAt: '2024-01-15T07:40:00Z',
        isLate: false,
      },
    ];

    // Setup: 未提出メンバー情報（4名）- 遅延リスク度合い順にソート
    const expectedUnsubmittedMembers: UnsubmittedMemberInfo[] = [
      {
        memberId: 'memberId-A',
        memberName: 'Engineer A',
        remainingMinutes: 60,
        promptPriority: 'high',
      },
      {
        memberId: 'memberId-B',
        memberName: 'Engineer B',
        remainingMinutes: 60,
        promptPriority: 'medium',
      },
      {
        memberId: 'memberId-C',
        memberName: 'Engineer C',
        remainingMinutes: 60,
        promptPriority: 'low',
      },
      {
        memberId: 'memberId-D',
        memberName: 'Engineer D',
        remainingMinutes: 60,
        promptPriority: 'low',
      },
    ];

    // Execute: getSubmissionStatus を呼び出し
    const result: SubmissionStatusResult = getSubmissionStatus(
      {
        teamId: 'team-001',
        reportDate: '2024-01-15',
        requesterId: 'requester-001',
      },
      {
        teamMemberIds,
        submittedMembers: submittedMemberInfoList,
        unsubmittedMembers: expectedUnsubmittedMembers,
        currentTime: aggregationTime,
        reportDeadlineTime,
        memberDelayCount,
      }
    );

    // Verify: 返された SubmissionStatusResult が期待値と一致すること
    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submittedCount).toBe(6);
    expect(result.unsubmittedCount).toBe(4);

    // Verify: 提出済みメンバー情報の検証
    expect(result.submittedMembers).toHaveLength(6);
    expect(result.submittedMembers[0]).toEqual({
      memberId: 'memberId-E',
      memberName: 'Engineer E',
      submittedAt: '2024-01-15T07:15:00Z',
      isLate: false,
    });
    expect(result.submittedMembers[5]).toEqual({
      memberId: 'memberId-J',
      memberName: 'Engineer J',
      submittedAt: '2024-01-15T07:40:00Z',
      isLate: false,
    });

    // Verify: 未提出メンバー情報が遅延リスク優先度順（high → medium → low）にソートされていること
    expect(result.unsubmittedMembers).toHaveLength(4);

    // 1番目: memberId-A (high リスク、遅延6回)
    expect(result.unsubmittedMembers[0]).toEqual({
      memberId: 'memberId-A',
      memberName: 'Engineer A',
      remainingMinutes: 60,
      promptPriority: 'high',
    });

    // 2番目: memberId-B (medium リスク、遅延3回)
    expect(result.unsubmittedMembers[1]).toEqual({
      memberId: 'memberId-B',
      memberName: 'Engineer B',
      remainingMinutes: 60,
      promptPriority: 'medium',
    });

    // 3番目: memberId-C (low リスク、遅延1回)
    expect(result.unsubmittedMembers[2]).toEqual({
      memberId: 'memberId-C',
      memberName: 'Engineer C',
      remainingMinutes: 60,
      promptPriority: 'low',
    });

    // 4番目: memberId-D (low リスク、遅延0回)
    expect(result.unsubmittedMembers[3]).toEqual({
      memberId: 'memberId-D',
      memberName: 'Engineer D',
      remainingMinutes: 60,
      promptPriority: 'low',
    });

    // Verify: aggregatedAt が ISO 8601 形式で返されていること
    expect(result.aggregatedAt).toBe('2024-01-15T07:00:00Z');

    // Verify: remaining minutes が正確に計算されていること（60分）
    const allUnsubmittedHaveSameRemaining = result.unsubmittedMembers.every(
      (member) => member.remainingMinutes === 60
    );
    expect(allUnsubmittedHaveSameRemaining).toBe(true);
  });
});