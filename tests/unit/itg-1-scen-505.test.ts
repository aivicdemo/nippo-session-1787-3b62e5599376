import { validateReportQuality } from '../../src/logic/report-quality-validation';

describe('朝会報告管理システム - レポート品質検証', () => {
  test('SCEN-505: リスク評価が空の場合、有用性基準未達として却下し修正指示を返す', () => {
    // Arrange
    const reportId = 'report-test-505';
    const reportContent = {
      sections: {
        issueExtraction: {
          data: [],
        },
        priorityScore: {
          value: 0,
        },
        analysisResult: {
          rootCauseClassification: '',
          countermeasurePriority: '',
          executionPlanOutline: '',
        },
      },
    };
    const sourceReportDataset = {
      yesterdayWork: 'completed',
      todayWork: 'planned',
      issues: [],
    };
    const validationCriteria = {
      completeness: {
        requiredSections: ['issueExtraction', 'priorityScore', 'analysisResult'],
      },
      accuracy: {
        toleranceThreshold: 0.95,
      },
      utility: {
        requiredInfo: ['rootCauseClassification', 'countermeasurePriority', 'executionPlanOutline'],
      },
    };

    const input = {
      reportId,
      reportContent,
      sourceReportDataset,
      validationCriteria,
    };

    // Act
    const result = validateReportQuality(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.validationStatus).toBe('rejected');
    expect(result.utilityResult.hasRootCauseClassification).toBe(false);
    expect(result.utilityResult.hasCountermeasurePriority).toBe(false);
    expect(result.utilityResult.hasExecutionPlanOutline).toBe(false);
    expect(result.utilityResult.missingInfo).toEqual(['根本原因分類', '対策優先順位', '実行計画案']);
    expect(result.correctionInstructions).toContain(
      'レポートの有用性基準を満たしていません。不足情報: 根本原因分類、対策優先順位、実行計画案。修正が必要です。'
    );
    expect(result.approvalEligibility).toBe(false);
  });
});