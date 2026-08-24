import { validateReportModificationWindow } from '../../src/logic/daily-report-management';
import { type ModificationWindowValidationResult } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告内容修正受付判定機能', () => {
  // SCEN-2710: [normal] 報告内容修正受付判定機能 - 期限を超過した場合、修正が禁止される
  test('修正受付期限を超過した場合、修正が禁止されること', () => {
    // 前提: 報告を送信し、システム時刻を修正受付期限を超過した時刻に進める
    // 朝会開始時刻: 09:00
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    
    // 報告送信時刻: 08:00（朝会開始前）
    const submittedAt = new Date('2024-01-15T08:00:00Z');
    
    // 現在時刻: 送信から25時間後（修正受付期限を超過）
    // 修正期限: 朝会開始時刻 + 0分 = 09:00
    // 送信から25時間後 = 2024-01-16T09:00:00Z
    const currentTimestamp = new Date('2024-01-16T09:00:00Z');
    
    // 修正期限オフセット: 0分（朝会開始時刻が修正期限）
    const modificationDeadlineOffsetMinutes = 0;
    
    // 入力パラメータ
    const input = {
      submittedAt: submittedAt.toISOString(),
      morningMeetingStartTime: morningMeetingStartTime.toISOString(),
      currentTimestamp,
      modificationDeadlineOffsetMinutes,
    };

    // 実行
    const result: ModificationWindowValidationResult = validateReportModificationWindow(input);

    // 期待結果の検証
    // 修正受付期限を超過しているため、修正が禁止される
    expect(result.isModificationAllowed).toBe(false);
    
    // 修正期限までの残り時間は負の値（期限超過を示す）
    // 現在: 09:00 (25時間後), 期限: 09:00 (初日)
    // 残り時間: -1440分（24時間遅延）
    expect(result.remainingMinutes).toBe(-1440);
    
    // 修正期限は朝会開始時刻
    const expectedDeadline = new Date('2024-01-15T09:00:00Z');
    expect(result.modificationDeadline.toISOString()).toBe(expectedDeadline.toISOString());
    
    // 修正が許可されない場合の理由メッセージが含まれる
    expect(result.reason).toBeDefined();
    expect(result.reason).toMatch(/修正受付期限/);
  });
});