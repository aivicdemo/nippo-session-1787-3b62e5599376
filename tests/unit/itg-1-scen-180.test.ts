import { validateReportQuality } from '../../src/logic/report-quality-validation';
import type {
  ReportQualityValidationInput,
  ReportQualityValidationResult,
  ValidationCriteria,
  CompletenessValidationResult,
  AccuracyValidationResult,
  UtilityValidationResult,
} from '../../src/logic/report-quality-validation';

describe('レポート品質検証 - 完全性チェック', () => {
  test('SCEN-180: レポートに必須データセクションが不足している場合、完全性基準未達と判定し、修正指示を返す', () => {
    // Arrange: テスト対象レポートを構築（課題抽出結果セクションのみを含める）
    const reportId = 'report-001';
    const reportContent = {
      issueExtractionResult: {
        issues: [
          { issueId: 'issue-1', keyword: 'バグ', frequency: 3 },
          { issueId: 'issue-2', keyword: 'パフォーマンス低下', frequency: 2 },
        ],
      },
      // 優先度スコアと分析結果は意図的に除外
    };

    const sourceReportDataset = {
      reportData: [
        {
          employeeId: 'emp-001',
          reportDate: '2024-01-15',
          issues: 'バグが発生した',
        },
      ],
    };

    const validationCriteria: ValidationCriteria = {
      requiredSections: ['issueExtractionResult', 'priorityScore', 'analysisResult'],
      accuracyThreshold: 95,
      requiredUtilityElements: ['keyIssues', 'recommendations'],
    };

    const input: ReportQualityValidationInput = {
      reportId,
      reportContent,
      sourceReportDataset,
      validationCriteria,
    };

    // Act: validateReportQuality を実行
    const result: ReportQualityValidationResult = validateReportQuality(input);

    // Assert: 完全性基準が未達であることを検証
    expect(result.isValid).toBe(false);
    expect(result.validationStatus).toBe('rejected');

    // completenessResult に不足セクションが記録されていることを検証
    expect(result.completenessResult).toBeDefined();
    expect(result.completenessResult.isComplete).toBe(false);
    expect(result.completenessResult.missingItems).toContain('priorityScore');
    expect(result.completenessResult.missingItems).toContain('analysisResult');
    expect(result.completenessResult.missingItems.length).toBe(2);

    // correctionInstructions に修正指示が含まれていることを検証
    expect(result.correctionInstructions).toBeDefined();
    expect(result.correctionInstructions.length).toBeGreaterThan(0);
    const correctionMessage = result.correctionInstructions.join(' ');
    expect(correctionMessage).toMatch(/完全性/);
    expect(correctionMessage).toMatch(/優先度スコア/);
    expect(correctionMessage).toMatch(/分析結果/);
    expect(correctionMessage).toMatch(/修正/);

    // approvalEligibility が false であることを検証
    expect(result.approvalEligibility).toBe(false);
  });
});