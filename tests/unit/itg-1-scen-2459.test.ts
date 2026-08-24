import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('validateMonthlyReportApproval', () => {
  // SCEN-2459
  test('should record audit log with precise timestamp at business day start plus 1 second (09:00:01)', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['API設計', 'パフォーマンス'],
        frequency: { 'API設計': 3, 'パフォーマンス': 2 }
      }),
      assessImpactScore: jest.fn().mockReturnValue(72),
      classifyIssueSeverity: jest.fn().mockReturnValue('high')
    };

    const testReportData = {
      reportId: 'RPT-20260820-001',
      yesterday: 'APIエンドポイント実装完了、単体テスト実施',
      today: 'API統合テスト実施、パフォーマンス測定',
      issues: 'API設計の変更により実装やり直しが必要。パフォーマンス測定でボトルネック発見。',
      confirmedAt: new Date('2026-08-20T09:00:01+09:00'),
      userId: 'USR-20260815-PM001',
      judgmentLogic: 'impact_frequency_combined',
      logicVersion: '1.2.0'
    };

    const result = validateMonthlyReportApproval(
      testReportData,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual(
      expect.objectContaining({
        isValid: true,
        auditLogRecord: expect.objectContaining({
          reportId: 'RPT-20260820-001',
          confirmedAt: '2026-08-20T09:00:01+09:00',
          confirmedAtMillis: expect.any(Number),
          userId: 'USR-20260815-PM001',
          extractedKeywords: ['API設計', 'パフォーマンス'],
          impactScore: 72,
          issueSeverity: 'high',
          judgmentLogic: 'impact_frequency_combined',
          logicVersion: '1.2.0',
          recordedTimestamp: expect.any(String)
        })
      })
    );

    const auditRecord = result.auditLogRecord;
    const confirmedAtDate = new Date(auditRecord.confirmedAt);
    expect(confirmedAtDate.getUTCSeconds()).toBe(1);
    expect(confirmedAtDate.getUTCMinutes()).toBe(0);
    expect(confirmedAtDate.getUTCHours()).toBe(0);

    expect(auditRecord.confirmedAtMillis).toBe(1724137201000);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      testReportData.issues
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      ['API設計', 'パフォーマンス']
    );
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      testReportData.issues
    );
  });
});