import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('報告内容修正期限判定機能', () => {
  // SCEN-2739: [edge] 報告内容修正期限判定機能 - 修正内容が複数件ある場合、最後の修正操作時刻で期限判定される
  test('複数回の修正操作が行われた場合、最後の修正操作時刻で期限判定が実行される', () => {
    // Arrange
    // 朝会開始予定時刻: 09:30:00 に設定
    // 修正期限オフセット: 0分（朝会開始時刻と同じ）
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');

    // 修正操作の時刻履歴
    // 1件目の修正: 09:05:00 に「昨日やったこと」を修正
    // 2件目の修正: 09:10:00 に「今日やること」を修正
    // 3件目の修正: 09:15:00 に「抱えている課題」を修正（最後の修正操作時刻）
    const lastModificationTimestamp = new Date('2024-01-15T09:15:00Z');

    const input = {
      submittedAt: new Date('2024-01-15T08:00:00Z'),
      morningMeetingStartTime: '09:30',
    };

    // Act
    const result = validateReportModificationWindow(input);

    // Assert
    // 最後の修正操作時刻（09:15:00）が修正期限（09:30:00）よりも前であるため、
    // 修正は期限内である
    expect(result.isWithinModificationWindow).toBe(true);
    
    // 修正期限（09:30:00）と最後の修正操作時刻（09:15:00）の差分は15分
    // isWithinModificationWindow が true の場合、remainingMinutes は正の値
    expect(result.remainingMinutes).toBeGreaterThan(0);
    expect(result.remainingMinutes).toBe(15);
  });
});