import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況の集計・表示機能', () => {
  // SCEN-422
  test('報告期限を1秒未満で切る直前（期限1秒前）の状態で、メンバーが未提出として集計される', () => {
    // Arrange: モック時刻を「2026-08-20T08:59:59.999Z」（期限の1秒前）に固定
    const mockCurrentTime = new Date('2026-08-20T08:59:59.999Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentTime);

    const reportDeadlineTime = new Date('2026-08-20T09:00:00.000Z');
    const teamId = 'team-001';
    const requestUserId = 'manager-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: '2026-08-20',
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // モック対象: 内部で使用される報告データ、ユーザー情報、期限設定
    // 実装では、このinputに基づいて集計処理を実行
    // メンバーA（未提出状態）を含むチームメンバー3名のシナリオを想定
    // - メンバーA: 未提出
    // - メンバーB: 期限内に提出済み
    // - メンバーC: 期限内に提出済み

    // Act: aggregateReportSubmissionStatusを呼び出し
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    // Assert: 
    // 1. メンバーAが「未提出」として集計されていることを確認
    expect(result.unsubmittedCount).toBe(1);
    
    // 2. 提出済みメンバー数が2名（メンバーB、C）であることを確認
    expect(result.submittedCount).toBe(2);
    
    // 3. 総メンバー数が3名であることを確認
    expect(result.totalMembers).toBe(3);
    
    // 4. 未提出メンバーリストにメンバーAが含まれていることを確認
    expect(result.unsubmittedMembers).toContainEqual(
      expect.objectContaining({
        userId: 'member-a',
        userName: expect.any(String),
        email: expect.any(String),
        remainingMinutes: expect.any(Number),
      })
    );
    
    // 5. メンバーAの残り時間が1分未満（正確には1秒未満）であることを確認
    const memberARemaining = result.unsubmittedMembers.find((m) => m.userId === 'member-a');
    expect(memberARemaining?.remainingMinutes).toBeGreaterThanOrEqual(0);
    expect(memberARemaining?.remainingMinutes).toBeLessThanOrEqual(1);
    
    // 6. 提出率が66.7%（2/3）であることを確認
    expect(result.submissionRate).toBe(66.7);
    
    // 7. 集計実行時刻がISO 8601形式で記録されていることを確認
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    jest.useRealTimers();
  });
});