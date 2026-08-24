import { generateAndSendConfirmationEmail, type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('generateAndSendConfirmationEmail - Impact Score Validation', () => {
  // SCEN-449
  test('should halt processing and return error when impact score exceeds 100', async () => {
    // Arrange
    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const analysisDate = new Date('2024-01-15T00:00:00Z');
    
    const aggregatedReports = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-001',
        reporterName: 'Engineer A',
        yesterdayAccomplishment: 'Completed API integration',
        todayPlan: 'Start database migration',
        challenges: 'Database schema conflict detected',
        submissionDateTime: new Date('2024-01-15T08:30:00Z'),
      },
    ];

    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['schema conflict', 'database'],
        frequency: { 'schema conflict': 2, 'database': 3 },
      }),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate,
    };

    // Act & Assert
    await expect(
      generateAndSendConfirmationEmail(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/IMPACT_SCORE_EXCEEDED/);

    // Verify that assessImpactScore was called
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});