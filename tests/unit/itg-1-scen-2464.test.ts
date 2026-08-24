import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート承認検証機能', () => {
  test('SCEN-2464: 分析結果監査ログの確定日時が月初日00:00:00で記録される', () => {
    // Arrange: テスト入力データの準備
    const reportId = 'REPORT-2024-01';
    const approverUserId = 'USER-MANAGER-001';
    const approvalStatus = 'approved' as const;
    const processedAtTimestamp = new Date('2024-01-01T00:00:00Z');

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['課題A', '課題B'],
        frequency: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScores: [75, 45],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severities: ['high', 'medium'],
      }),
    };

    // 時刻をモック化（月初日00:00:00）
    const mockCurrentDate = new Date('2024-01-01T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockCurrentDate as unknown as string);

    const input = {
      reportId,
      approvalStatus,
      approverUserId,
    };

    // Act: validateMonthlyReportApprovalを実行
    const result = validateMonthlyReportApproval(input);

    // Assert: 監査ログの確定日時が正確に月初日00:00:00で記録されていることを確認
    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportId);
    expect(result.approvalStatus).toBe(approvalStatus);
    expect(result.processedAt).toEqual(processedAtTimestamp);

    // 監査ログの確定日時フィールドが月初日00:00:00（2024-01-01T00:00:00Z）で記録されていることを検証
    const expectedConfirmedAt = new Date('2024-01-01T00:00:00Z');
    expect(result.processedAt.getUTCFullYear()).toBe(2024);
    expect(result.processedAt.getUTCMonth()).toBe(0); // 1月は0（0ベースインデックス）
    expect(result.processedAt.getUTCDate()).toBe(1);
    expect(result.processedAt.getUTCHours()).toBe(0);
    expect(result.processedAt.getUTCMinutes()).toBe(0);
    expect(result.processedAt.getUTCSeconds()).toBe(0);
    expect(result.processedAt.getUTCMilliseconds()).toBe(0);

    // クリーンアップ
    jest.restoreAllMocks();
  });
});