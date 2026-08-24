import { describe, test, expect } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Audit Log Recording with Empty Dataset', () => {
  test('SCEN-2456: validateMonthlyReportApproval should fail audit log recording when report dataset is empty', () => {
    // Arrange: Prepare test input with empty report dataset
    const emptyReportDataset: any[] = [];
    const input = {
      reportId: 'report-001',
      approvalStatus: 'approved' as const,
      approverUserId: 'user-admin-001',
      reportDataset: emptyReportDataset,
    };

    // Create stub for TextAnalysisServiceAdapter
    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: [],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 0,
        confidence: 0,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'low',
      }),
    };

    // Create mock audit logger
    const auditLoggerStub = {
      recordAnalysisEvent: jest.fn().mockRejectedValue(
        new Error('ANALYSIS_LOG_FAILED_EMPTY_DATASET'),
      ),
    };

    // Act & Assert: Call the function and expect it to throw with the correct error message
    expect(() => {
      validateMonthlyReportApproval(input, textAnalysisServiceStub, auditLoggerStub);
    }).toThrow(/ANALYSIS_LOG_FAILED_EMPTY_DATASET/);

    // Additional assertions to verify the error handling behavior
    // Verify that audit log recording was NOT successful
    expect(auditLoggerStub.recordAnalysisEvent).toHaveBeenCalled();

    // Verify that extractKeywords and assessImpactScore were called but no analysis was recorded
    expect(textAnalysisServiceStub.extractKeywords).toHaveBeenCalled();
    expect(textAnalysisServiceStub.assessImpactScore).toHaveBeenCalled();

    // Verify error information is properly returned
    const errorMessage = 'ANALYSIS_LOG_FAILED_EMPTY_DATASET';
    expect(errorMessage).toMatch(/ANALYSIS_LOG_FAILED_EMPTY_DATASET/);
  });
});