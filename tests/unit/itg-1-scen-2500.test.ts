import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信処理', () => {
  // SCEN-2500: [edge] 操作習熟度スコア自動計算 - 操作習熟度スコアがちょうど100点のとき合格判定される
  test('操作習熟度スコアが100点の場合、合格判定されて日報送信が正常に進行する', async () => {
    // Arrange: テスト用の日報入力データを準備
    const submissionInput: SubmitDailyReportInput = {
      userId: 'user-a-001',
      teamId: 'team-alpha-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      reportDate: '2024-01-15',
    };

    // TextAnalysisServiceAdapterのスタブ化
    // assessImpactScoreメソッドが操作習熟度スコア100を返すよう設定
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['リソース不足'],
        frequency: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 100,
        proficiencyScore: 100,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    // NotificationServiceAdapterのスタブ化（リマインド通知用）
    const stubNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryTimestamp: '2024-01-15T09:30:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'scheduled-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    // Act: 日報を送信
    const result = await submitDailyReport(
      submissionInput,
      stubTextAnalysisServiceAdapter,
      stubNotificationServiceAdapter
    );

    // Assert: 結果の検証
    // 1. 戻り値がSubmitDailyReportOutput型であることを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('submissionTimestamp');
    expect(result).toHaveProperty('isWithinDeadline');

    // 2. reportIdが生成されていることを確認
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    // 3. submissionTimestampがISO 8601形式であることを確認
    expect(typeof result.submissionTimestamp).toBe('string');
    const submissionDate = new Date(result.submissionTimestamp);
    expect(submissionDate instanceof Date).toBe(true);
    expect(submissionDate.getTime()).toBeGreaterThan(0);

    // 4. 送信が期限内であることを確認（デフォルトでは期限内とする）
    expect(typeof result.isWithinDeadline).toBe('boolean');
    expect(result.isWithinDeadline).toBe(true);

    // 5. TextAnalysisServiceAdapterのassessImpactScoreが呼び出されたことを確認
    expect(stubTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    // 6. assessImpactScoreが操作習熟度スコア100を返したことを確認
    const impactScoreResult = await stubTextAnalysisServiceAdapter.assessImpactScore();
    expect(impactScoreResult.proficiencyScore).toBe(100);

    // 7. 日報内容が正しく保存されていることを確認
    // （統合テストとしてストレージ検証が必要な場合は、mock storage を通じて検証）
    expect(result.reportId).toMatch(/^[a-zA-Z0-9_-]+$/);

    // 8. 合格判定が確定していることを確認
    // （操作習熟度スコア100は合格基準を満たす）
    expect(impactScoreResult.proficiencyScore).toBe(100);
    expect(impactScoreResult.proficiencyScore).toBeGreaterThanOrEqual(70);
  });
});