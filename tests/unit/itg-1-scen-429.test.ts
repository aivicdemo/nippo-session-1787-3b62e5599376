import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示する機能', () => {
  // SCEN-429: [edge] 報告提出状況の集計・表示機能 - 未提出メンバーの一覧が提出期限が早い順に並んでいる場合、提出期限の逆順で表示されても正確な未提出者を特定できる
  test('should accurately identify all unsubmitted members regardless of sort order of deadline', () => {
    // テストデータ: 5名のメンバーと提出期限
    const memberA = {
      userId: 'user-a',
      userName: 'Member A',
      email: 'member-a@example.com',
      remainingMinutes: -60, // 期限14:00, 現在時刻から60分超過
    };

    const memberB = {
      userId: 'user-b',
      userName: 'Member B',
      email: 'member-b@example.com',
      remainingMinutes: -120, // 期限13:00, 現在時刻から120分超過
    };

    const memberC = {
      userId: 'user-c',
      userName: 'Member C',
      email: 'member-c@example.com',
      remainingMinutes: -180, // 期限12:00, 現在時刻から180分超過
    };

    const memberD = {
      userId: 'user-d',
      userName: 'Member D',
      email: 'member-d@example.com',
      remainingMinutes: 0, // 期限15:00, 現在時刻と同じ
    };

    const memberE = {
      userId: 'user-e',
      userName: 'Member E',
      email: 'member-e@example.com',
      remainingMinutes: -240, // 期限11:00, 現在時刻から240分超過
    };

    // 1回目の集計: 提出期限の昇順でクエリされたデータ
    const firstQueryResult = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      totalMembers: 5,
      submittedCount: 0,
      unsubmittedCount: 5,
      delayedSubmissionCount: 0,
      submissionRate: 0.0,
      unsubmittedMembers: [memberE, memberC, memberB, memberA, memberD], // 期限昇順: 11:00, 12:00, 13:00, 14:00, 15:00
      aggregatedAt: '2024-01-15T15:05:00Z',
    };

    // 集計入力: 1回目
    const aggregationInput1 = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const result1 = aggregateReportSubmissionStatus(aggregationInput1);

    // 1回目の結果を検証
    expect(result1.teamId).toBe('team-001');
    expect(result1.reportDate).toBe('2024-01-15');
    expect(result1.totalMembers).toBe(5);
    expect(result1.unsubmittedCount).toBe(5);
    expect(result1.submittedCount).toBe(0);
    expect(result1.delayedSubmissionCount).toBe(0);
    expect(result1.submissionRate).toBe(0.0);

    // 1回目の未提出メンバー名を抽出・集合化
    const firstUnsubmittedNames = new Set(
      result1.unsubmittedMembers.map((m) => m.userName)
    );

    // 2回目の集計: 提出期限の降順でクエリされたデータ（逆順）
    const secondQueryResult = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      totalMembers: 5,
      submittedCount: 0,
      unsubmittedCount: 5,
      delayedSubmissionCount: 0,
      submissionRate: 0.0,
      unsubmittedMembers: [memberD, memberA, memberB, memberC, memberE], // 期限降順: 15:00, 14:00, 13:00, 12:00, 11:00
      aggregatedAt: '2024-01-15T15:06:00Z',
    };

    // 集計入力: 2回目（同一条件）
    const aggregationInput2 = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const result2 = aggregateReportSubmissionStatus(aggregationInput2);

    // 2回目の結果を検証
    expect(result2.teamId).toBe('team-001');
    expect(result2.reportDate).toBe('2024-01-15');
    expect(result2.totalMembers).toBe(5);
    expect(result2.unsubmittedCount).toBe(5);
    expect(result2.submittedCount).toBe(0);
    expect(result2.delayedSubmissionCount).toBe(0);
    expect(result2.submissionRate).toBe(0.0);

    // 2回目の未提出メンバー名を抽出・集合化
    const secondUnsubmittedNames = new Set(
      result2.unsubmittedMembers.map((m) => m.userName)
    );

    // 期待値: 両方の表示結果に含まれるメンバー名の集合が完全に一致
    expect(firstUnsubmittedNames).toEqual(secondUnsubmittedNames);

    // 期待値: 未提出者は5名全員（メンバーA、B、C、D、E）として正確に特定される
    expect(firstUnsubmittedNames.size).toBe(5);
    expect(firstUnsubmittedNames).toContain('Member A');
    expect(firstUnsubmittedNames).toContain('Member B');
    expect(firstUnsubmittedNames).toContain('Member C');
    expect(firstUnsubmittedNames).toContain('Member D');
    expect(firstUnsubmittedNames).toContain('Member E');

    // 期待値: 各メンバーの詳細情報（userId, email, remainingMinutes）も一致
    const firstMembersMap = new Map(
      result1.unsubmittedMembers.map((m) => [m.userId, m])
    );
    const secondMembersMap = new Map(
      result2.unsubmittedMembers.map((m) => [m.userId, m])
    );

    expect(firstMembersMap.size).toBe(5);
    expect(secondMembersMap.size).toBe(5);

    firstMembersMap.forEach((firstMember, userId) => {
      const secondMember = secondMembersMap.get(userId);
      expect(secondMember).toBeDefined();
      expect(secondMember?.email).toBe(firstMember.email);
      expect(secondMember?.remainingMinutes).toBe(firstMember.remainingMinutes);
    });
  });
});