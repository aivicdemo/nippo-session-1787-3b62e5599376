import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('日報修正期限判定機能', () => {
  // SCEN-2735: [edge] 報告内容修正期限判定機能 - 朝会開始時刻を1秒超過した時点で修正禁止となる
  test('朝会開始時刻の1秒超過後は修正禁止となる', () => {
    const morningMeetingStartTime = new Date('2025-01-15T09:00:00.000Z');

    // ステップ4: 朝会開始時刻の0.999秒後に修正操作を実行
    const submissionTimestampBefore1Second = new Date('2025-01-15T09:00:00.999Z');
    const resultBefore1Second = validateReportModificationWindow({
      submittedAt: submissionTimestampBefore1Second.toISOString(),
      morningMeetingStartTime: morningMeetingStartTime.toTimeString().slice(0, 5),
    });

    // ステップ4の期待結果: 修正が正常に保存される
    expect(resultBefore1Second.isWithinModificationWindow).toBe(true);
    expect(resultBefore1Second.remainingMinutes).toBeGreaterThan(-1);

    // ステップ6: 朝会開始時刻の1.001秒後に修正操作を実行
    const submissionTimestampAfter1Second = new Date('2025-01-15T09:00:01.001Z');
    const resultAfter1Second = validateReportModificationWindow({
      submittedAt: submissionTimestampAfter1Second.toISOString(),
      morningMeetingStartTime: morningMeetingStartTime.toTimeString().slice(0, 5),
    });

    // ステップ6の期待結果: 修正操作が受け付けられない
    expect(resultAfter1Second.isWithinModificationWindow).toBe(false);
    expect(resultAfter1Second.remainingMinutes).toBeLessThan(0);
  });
});