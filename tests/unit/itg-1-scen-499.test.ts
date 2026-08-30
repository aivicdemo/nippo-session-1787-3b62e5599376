import { validateReportQuality } from '../../src/logic/report-quality-validation';
import { type ReportQualityValidationInput, type ReportQualityValidationResult } from '../../src/logic/report-quality-validation';

describe('Report Quality Validation - validateReportQuality', () => {
  test('SCEN-499: [normal] 生成されたレポートの完全性・正確性・有用性を検証し、品質基準を満たすかを判定して、基準未達の場合は修正指示内容を返す', () => {
    const reportInput: ReportQualityValidationInput = {
      reportId: 'report-20240115-001',
      reportContent: {
        sections: {
          summary: 'ビルドプロセスの自動化に関する報告',
          issues: ['ISSUE-001', 'ISSUE-002'],
          analysis: 'ビルド時間を30分短縮可能',
          recommendations: ['ツール導入', '統合テスト実施'],
        },
        metadata: {
          generatedAt: '2024-01-15T09:00:00Z',
          period: { startDate: '2024-01-08', endDate: '2024-01-15' },
        },
      },
      sourceReportDataset: {
        reports: [
          { id: 'daily-001', date: '2024-01-08', content: 'Build process analysis' },
          { id: 'daily-002', date: '2024-01-09', content: 'Tool evaluation' },
        ],
      },
      validationCriteria: {
        requiredSections: ['summary', 'issues', 'analysis', 'recommendations'],
        accuracyThreshold: 95,
        requiredUtilityElements: ['issues', 'analysis', 'recommendations'],
      },
    };

    const result: ReportQualityValidationResult = validateReportQuality(reportInput);

    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe('approved');
    expect(result.completenessResult).toBeDefined();
    expect(result.completenessResult.isComplete).toBe(true);
    expect(result.completenessResult.missingItems).toEqual([]);
    expect(result.accuracyResult).toBeDefined();
    expect(result.accuracyResult.isAccurate).toBe(true);
    expect(result.utilityResult).toBeDefined();
    expect(result.utilityResult.isUtilityValid).toBe(true);
    expect(result.correctionInstructions).toEqual([]);
    expect(result.approvalEligibility).toBe(true);
  });
});