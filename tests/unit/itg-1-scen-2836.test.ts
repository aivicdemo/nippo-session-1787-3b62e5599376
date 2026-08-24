import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー優先度判定機能 - 月末日24時59分59秒の報告期限', () => {
  // SCEN-2836
  test('月末日23時29分59秒と23時59分59秒の優先度スコア再計算が正確に実行される', async () => {
    // Arrange: 月末日を2024-01-31とする
    const monthEndDate = '2024-01-31';
    const teamId = 'team-001';
    const executorUserId = 'executor-user-001';
    const morningMeetingStartTime = '09:00';
    
    // 報告期限は月末日の23時59分59秒
    const reportDeadlineTime = new Date(`${monthEndDate}T23:59:59Z`);
    
    // 最初の判定時刻: 月末日23時29分59秒
    const firstCheckTime = new Date(`${monthEndDate}T23:29:59Z`);
    
    // 2番目の判定時刻: 月末日23時59分59秒
    const secondCheckTime = new Date(`${monthEndDate}T23:59:59Z`);
    
    // 期限までの残り時間を計算
    const firstRemainingMinutes = Math.floor((reportDeadlineTime.getTime() - firstCheckTime.getTime()) / (1000 * 60));
    const secondRemainingMinutes = Math.floor((reportDeadlineTime.getTime() - secondCheckTime.getTime()) / (1000 * 60));
    
    // 期待値: 最初の判定では残り時間が90分（1時間30分）
    expect(firstRemainingMinutes).toBe(90);
    
    // 期待値: 2番目の判定では残り時間が0分（23時59分59秒と23時59分59秒は同じため）
    // または、秒単位で計算すると0に近い値
    expect(secondRemainingMinutes).toBe(0);
    
    // 最初の判定入力
    const firstInput: DetectUnsubmittedMembersInput = {
      teamId: teamId,
      reportDate: monthEndDate,
      morningMeetingStartTime: morningMeetingStartTime,
      executorUserId: executorUserId
    };
    
    // 2番目の判定入力
    const secondInput: DetectUnsubmittedMembersInput = {
      teamId: teamId,
      reportDate: monthEndDate,
      morningMeetingStartTime: morningMeetingStartTime,
      executorUserId: executorUserId
    };
    
    // Act: 最初の判定を実行
    // システム時刻をモック設定して最初の判定時刻で実行
    const jest_original_now = Date.now;
    Date.now = jest.fn(() => firstCheckTime.getTime());
    
    const firstResult: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(firstInput);
    
    // Assert: 最初の結果を検証
    expect(firstResult).toBeDefined();
    expect(firstResult.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(firstResult.unsubmittedMembers)).toBe(true);
    
    // 最初の判定での優先度スコアを記録（未提出メンバーが存在する場合）
    let firstPriorityScore: number | undefined;
    if (firstResult.unsubmittedMembers.length > 0) {
      // 優先度スコアは remainingMinutes に基づいて計算される
      // 残り時間90分の場合、優先度スコアは相対的に低い（緊急度が低い）
      const firstMember = firstResult.unsubmittedMembers[0];
      firstPriorityScore = firstMember.remainingMinutes;
      expect(firstPriorityScore).toBe(90);
    }
    
    // Act: 2番目の判定を実行
    // システム時刻をモック設定して2番目の判定時刻で実行
    Date.now = jest.fn(() => secondCheckTime.getTime());
    
    const secondResult: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(secondInput);
    
    // Assert: 2番目の結果を検証
    expect(secondResult).toBeDefined();
    expect(secondResult.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(secondResult.unsubmittedMembers)).toBe(true);
    
    // 2番目の判定での優先度スコアを記録
    let secondPriorityScore: number | undefined;
    if (secondResult.unsubmittedMembers.length > 0) {
      // 残り時間0分（または負数、期限超過の場合）の場合、優先度スコアは相対的に高い（緊急度が高い）
      const secondMember = secondResult.unsubmittedMembers[0];
      secondPriorityScore = secondMember.remainingMinutes;
      expect(secondPriorityScore).toBe(0);
    }
    
    // Assert: 優先度スコアの再計算が正確に実行されたことを確認
    if (firstPriorityScore !== undefined && secondPriorityScore !== undefined) {
      // 期限までの残り時間が減少している（30分の時間経過を反映）
      expect(firstPriorityScore).toBeGreaterThan(secondPriorityScore);
      
      // 期待される時間差は90分 - 0分 = 90分
      const timeDifference = firstPriorityScore - secondPriorityScore;
      expect(timeDifference).toBe(90);
    }
    
    // Cleanup
    Date.now = jest_original_now;
  });
});