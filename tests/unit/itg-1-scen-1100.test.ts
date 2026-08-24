import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況追跡機能 - aggregateReportSubmissionStatus', () => {
  // SCEN-1100: [edge] 報告提出状況追跡機能 - 本日の報告提出状況が提出期限の1秒前に未提出として表示される
  test('SCEN-1100: 提出期限の1秒前に未提出メンバーが正確に集計される', async () => {
    // 固定的なテスト時刻を設定
    const currentTime = new Date('2024-01-15T08:59:59Z'); // 期限の1秒前
    const deadlineTime = new Date('2024-01-15T09:00:00Z'); // 09:00:00が期限
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'manager-001';

    // チームメンバー10名のうち、8名が期限内に提出済み、2名が未提出
    const totalMembers = 10;
    const submittedCount = 8;
    const unsubmittedCount = 2;
    const delayedSubmissionCount = 0;

    // 期待される提出率: (8 / 10) * 100 = 80.0
    const expectedSubmissionRate = 80.0;

    // 残り時間（分単位）：1秒 = 0.0167分 ≈ 0分（小数第1位まで）、システムでは秒単位の精度を持つため、remainingMinutes は 0 で四捨五入
    const expectedRemainingMinutes = 0;

    // 未提出メンバーの詳細情報
    const unsubmittedMembers = [
      {
        userId: 'user-009',
        userName: 'Engineer Nine',
        email: 'engineer009@example.com',
        remainingMinutes: 0,
      },
      {
        userId: 'user-010',
        userName: 'Engineer Ten',
        email: 'engineer010@example.com',
        remainingMinutes: 0,
      },
    ];

    // テスト入力
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 集計実行
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    // 期待値との検証
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(expectedSubmissionRate);
    expect(result.unsubmittedMembers).toHaveLength(unsubmittedCount);
    expect(result.unsubmittedMembers[0].userId).toBe('user-009');
    expect(result.unsubmittedMembers[0].userName).toBe('Engineer Nine');
    expect(result.unsubmittedMembers[0].email).toBe('engineer009@example.com');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(expectedRemainingMinutes);
    expect(result.unsubmittedMembers[1].userId).toBe('user-010');
    expect(result.unsubmittedMembers[1].userName).toBe('Engineer Ten');
    expect(result.unsubmittedMembers[1].email).toBe('engineer010@example.com');
    expect(result.unsubmittedMembers[1].remainingMinutes).toBe(expectedRemainingMinutes);

    // aggregatedAt は ISO 8601 形式であることを確認
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 集計実行時刻が現在時刻付近であることを確認（テスト時刻の前後5秒以内）
    const aggregatedAtTime = new Date(result.aggregatedAt);
    const timeDiff = Math.abs(aggregatedAtTime.getTime() - currentTime.getTime());
    expect(timeDiff).toBeLessThanOrEqual(5000); // 5秒以内
  });
});