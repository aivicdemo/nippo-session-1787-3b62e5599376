import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー検出・通知機能', () => {
  // SCEN-404: [normal] 未提出メンバー一覧の生成機能 - 未提出メンバーが複数人の場合、全メンバーの情報が一覧に含まれる
  test('複数の未提出メンバーを検出し、昇順でソートされた一覧を生成する', () => {
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'manager-001',
    };

    const result: DetectUnsubmittedMembersOutput = detectAndNotifyUnsubmittedMembers(input);

    // 未提出メンバー一覧に5名全員が含まれることを検証
    expect(result.unsubmittedMembers).toHaveLength(5);

    // ユーザーID基準の昇順でソートされていることを検証
    const userIds = result.unsubmittedMembers.map(member => member.userId);
    expect(userIds).toEqual(['memberA', 'memberB', 'memberC', 'memberD', 'memberE']);

    // 各メンバーの必須情報が含まれていることを検証
    result.unsubmittedMembers.forEach(member => {
      expect(member).toHaveProperty('userId');
      expect(member).toHaveProperty('userName');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('remainingMinutes');

      // 各フィールドが適切な値であることを検証
      expect(typeof member.userId).toBe('string');
      expect(typeof member.userName).toBe('string');
      expect(typeof member.email).toBe('string');
      expect(typeof member.remainingMinutes).toBe('number');

      // メールアドレスが有効な形式であることを検証
      expect(member.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    // 具体的なメンバー情報を検証
    const memberAData = result.unsubmittedMembers.find(m => m.userId === 'memberA');
    expect(memberAData).toBeDefined();
    expect(memberAData?.userName).toBe('メンバーA');
    expect(memberAData?.email).toBe('memberA@example.com');
    expect(typeof memberAData?.remainingMinutes).toBe('number');

    const memberBData = result.unsubmittedMembers.find(m => m.userId === 'memberB');
    expect(memberBData).toBeDefined();
    expect(memberBData?.userName).toBe('メンバーB');
    expect(memberBData?.email).toBe('memberB@example.com');

    const memberCData = result.unsubmittedMembers.find(m => m.userId === 'memberC');
    expect(memberCData).toBeDefined();
    expect(memberCData?.userName).toBe('メンバーC');
    expect(memberCData?.email).toBe('memberC@example.com');

    const memberDData = result.unsubmittedMembers.find(m => m.userId === 'memberD');
    expect(memberDData).toBeDefined();
    expect(memberDData?.userName).toBe('メンバーD');
    expect(memberDData?.email).toBe('memberD@example.com');

    const memberEData = result.unsubmittedMembers.find(m => m.userId === 'memberE');
    expect(memberEData).toBeDefined();
    expect(memberEData?.userName).toBe('メンバーE');
    expect(memberEData?.email).toBe('memberE@example.com');

    // 重複がないことを検証
    const uniqueUserIds = new Set(result.unsubmittedMembers.map(m => m.userId));
    expect(uniqueUserIds.size).toBe(5);

    // 処理実行時刻が ISO 8601 形式で記録されていることを検証
    expect(result.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 送信されたリマインド通知の件数が5件であることを検証
    expect(result.notificationsSent).toBe(5);

    // 通知送信失敗がないことを検証
    expect(result.notificationFailures).toHaveLength(0);
  });
});