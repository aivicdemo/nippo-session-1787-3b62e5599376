import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー検出と催促対象者自動判定', () => {
  // SCEN-2839: [edge] 催促対象者自動判定機能 - 優先度スコアが最高値の未提出メンバーが催促対象者の第一候補として選定される
  test('優先度スコア92の複数メンバー中から同点解決ルールに従い第一候補が選定される', () => {
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-manager-001'
    };

    const unsubmittedMembersWithScores = [
      {
        userId: 'user-a-001',
        userName: 'メンバーA',
        email: 'member-a@example.com',
        remainingMinutes: 45,
        priorityScore: 85
      },
      {
        userId: 'user-b-001',
        userName: 'メンバーB',
        email: 'member-b@example.com',
        remainingMinutes: 45,
        priorityScore: 92
      },
      {
        userId: 'user-c-001',
        userName: 'メンバーC',
        email: 'member-c@example.com',
        remainingMinutes: 45,
        priorityScore: 78
      },
      {
        userId: 'user-d-001',
        userName: 'メンバーD',
        email: 'member-d@example.com',
        remainingMinutes: 45,
        priorityScore: 92
      },
      {
        userId: 'user-e-001',
        userName: 'メンバーE',
        email: 'member-e@example.com',
        remainingMinutes: 45,
        priorityScore: 88
      }
    ];

    const result: DetectUnsubmittedMembersOutput = detectAndNotifyUnsubmittedMembers(
      input,
      unsubmittedMembersWithScores
    );

    // 第一候補者は優先度スコア92の者であることを確認
    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.unsubmittedMembers.length).toBe(5);

    // 優先度スコア92のメンバーを特定
    const maxScore = 92;
    const candidatesWithMaxScore = result.unsubmittedMembers.filter(
      member => member.priorityScore === maxScore
    );
    expect(candidatesWithMaxScore.length).toBeGreaterThanOrEqual(1);
    expect(candidatesWithMaxScore.length).toBeLessThanOrEqual(2);

    // 第一候補はユーザーID順に従い user-b-001 が選定されることを確認
    const firstCandidate = result.unsubmittedMembers.find(
      member => member.priorityScore === 92
    );
    expect(firstCandidate).toBeDefined();
    expect(firstCandidate?.userId).toBe('user-b-001');
    expect(firstCandidate?.userName).toBe('メンバーB');
    expect(firstCandidate?.email).toBe('member-b@example.com');
    expect(firstCandidate?.priorityScore).toBe(92);
    expect(firstCandidate?.selectionReason).toBe('優先度スコア最高値');

    // 通知送信されていないことを確認（催促選定ロジックのみの検証）
    expect(result.notificationsSent).toBe(0);
    expect(result.notificationFailures).toEqual([]);

    // 実行結果が ISO 8601 形式で記録されていることを確認
    expect(result.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});