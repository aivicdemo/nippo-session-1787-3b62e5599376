import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会開始時刻が月をまたぐ場合の報告内容修正期限判定', () => {
  // SCEN-2737
  test('月の境界をまたぐ時刻遷移（1月31日23時59分59秒→2月1日0時0分0秒）で、修正期限判定が正確に機能する', () => {
    // 朝会開始予定時刻: 1月31日23時59分59秒
    const morningMeetingStartTime = new Date('2024-01-31T23:59:59Z');
    
    // 報告の提出日時: 同日の早い時刻（修正期限内であることが明白）
    const submittedAt = new Date('2024-01-31T09:00:00Z');
    
    // 修正操作を試みた時刻: 2月1日0時0分0秒（月をまたいだ直後）
    const currentTimestamp = new Date('2024-02-01T00:00:00Z');
    
    // 修正期限オフセット: 朝会開始から+60分（1時間後が修正期限）
    const modificationDeadlineOffsetMinutes = 60;
    
    // 期限判定を実行
    const result = validateReportModificationWindow({
      submittedAt,
      morningMeetingStartTime,
      currentTimestamp,
      modificationDeadlineOffsetMinutes,
    });
    
    // 期待結果: 修正期限内（朝会開始23:59:59 + 60分 = 翌日0:59:59が期限）
    // 現在時刻が2月1日0:00:00であるため、期限内であり修正は許可される
    expect(result.isWithinModificationWindow).toBe(true);
    expect(result.modificationDeadline).toEqual(new Date('2024-02-01T00:59:59Z'));
    expect(result.remainingMinutes).toBeGreaterThan(0);
  });
});