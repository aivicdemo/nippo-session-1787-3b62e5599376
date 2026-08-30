import { verifyAdoptionReadiness } from '../../src/logic/adoption-training-management';
import type { InitialReportData, AdoptionReadinessVerificationResult } from '../../src/logic/adoption-training-management';

describe('AdoptionTrainingManagement', () => {
  // SCEN-592
  test('should verify adoption readiness and confirm production start eligibility when all criteria are met', () => {
    // Arrange
    const initialReportDataset: InitialReportData[] = Array.from({ length: 10 }, (_, i) => ({
      reportId: `report-${i + 1}`,
      engineerId: `engineer-${i + 1}`,
      submittedAt: new Date('2024-01-15T09:00:00Z'),
      reportContent: `Test report content ${i + 1}`
    }));

    const totalEngineerCount = 10;
    const submissionDeadline = new Date('2024-01-15T10:00:00Z');

    // Mock the helper functions to return values that meet all criteria
    const mockCalculateSubmissionRate = jest.fn().mockReturnValue(95);
    const mockCalculateReportQualityScore = jest.fn().mockReturnValue(85);
    const mockCalculateFormatUnificationDegree = jest.fn().mockReturnValue(90);

    // Temporarily replace module functions with mocks
    const moduleExports = require('../../src/logic/adoption-training-management');
    const originalCalculateSubmissionRate = moduleExports.calculateSubmissionRate;
    const originalCalculateReportQualityScore = moduleExports.calculateReportQualityScore;
    const originalCalculateFormatUnificationDegree = moduleExports.calculateFormatUnificationDegree;

    moduleExports.calculateSubmissionRate = mockCalculateSubmissionRate;
    moduleExports.calculateReportQualityScore = mockCalculateReportQualityScore;
    moduleExports.calculateFormatUnificationDegree = mockCalculateFormatUnificationDegree;

    try {
      // Act
      const result: AdoptionReadinessVerificationResult = verifyAdoptionReadiness({
        initialReportDataset,
        totalEngineerCount,
        submissionDeadline
      });

      // Assert
      expect(result.readinessStatus).toBe('ready');
      expect(result.verificationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(result.productionStartDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(result.blockers).toBeUndefined();
      expect(mockCalculateSubmissionRate).toHaveBeenCalledWith(
        initialReportDataset,
        totalEngineerCount
      );
      expect(mockCalculateReportQualityScore).toHaveBeenCalledWith(initialReportDataset);
      expect(mockCalculateFormatUnificationDegree).toHaveBeenCalledWith(initialReportDataset);
    } finally {
      // Restore original functions
      moduleExports.calculateSubmissionRate = originalCalculateSubmissionRate;
      moduleExports.calculateReportQualityScore = originalCalculateReportQualityScore;
      moduleExports.calculateFormatUnificationDegree = originalCalculateFormatUnificationDegree;
    }
  });
});