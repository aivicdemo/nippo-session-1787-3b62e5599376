import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1 Initial Deployment - Data Quality Score Rounding', () => {
  // SCEN-2622: [edge] Data quality score calculation rounding precision
  test('should round data quality score to second decimal place with consistent rounding rules', async () => {
    // Prepare test data for 3 team members with fractional completeness scores
    const deploymentParticipants = [
      {
        userId: 'eng-001',
        role: 'Engineer',
        email: 'engineer1@company.example.com'
      },
      {
        userId: 'eng-002',
        role: 'Engineer',
        email: 'engineer2@company.example.com'
      },
      {
        userId: 'eng-003',
        role: 'Engineer',
        email: 'engineer3@company.example.com'
      }
    ];

    const testInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
      participantList: deploymentParticipants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00'
    };

    // Mock AI client with realistic report data containing fractional quality metrics
    const mockAiClient = {
      evaluateInitialReports: jest.fn().mockResolvedValue({
        submissionRate: 100,
        dataQualityScore: 75.17, // (66.67 + 75.50 + 83.33) / 3 = 75.1666... → rounded to 75.17
        formatUniformityScore: 85.33, // Simulating another fractional value rounded to 2 decimals
        feedbackItems: [
          {
            userId: 'eng-001',
            completionPercentage: 66.67, // Fractional completeness score
            category: 'yesterday_tasks'
          },
          {
            userId: 'eng-002',
            completionPercentage: 75.50,
            category: 'today_tasks'
          },
          {
            userId: 'eng-003',
            completionPercentage: 83.33,
            category: 'issues'
          }
        ]
      }),
      extractKeywordScores: jest.fn().mockResolvedValue({
        keywordExtractionScore: 88.89 // Fractional extraction score
      }),
      generateDeploymentSchedule: jest.fn().mockResolvedValue({
        scheduledStartDate: new Date('2024-01-22T00:00:00Z'),
        phaseDeadlines: [
          {
            phaseName: 'training',
            deadline: new Date('2024-01-25T17:00:00Z')
          },
          {
            phaseName: 'initial_testing',
            deadline: new Date('2024-02-01T17:00:00Z')
          }
        ],
        plannedProductionStartDate: new Date('2024-02-05T00:00:00Z')
      })
    };

    // Execute the orchestrator with mocked AI client
    const result: Tx10AgentOutput = await runTx10Imp1Agent(testInput, mockAiClient);

    // Verify data quality score is properly rounded to 2 decimal places
    // Expected calculation: (66.67 + 75.50 + 83.33) / 3 = 75.1666...
    // Rounded to 2 decimals: 75.17
    expect(result.initialReportAnalysis.dataQualityScore).toBe(75.17);

    // Verify format uniformity score is also properly rounded
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(85.33);

    // Verify submission rate (no rounding needed as it's a whole percentage)
    expect(result.initialReportAnalysis.submissionRate).toBe(100);

    // Verify feedback items contain the fractional completeness values
    expect(result.initialReportAnalysis.feedbackItems).toHaveLength(3);
    expect(result.initialReportAnalysis.feedbackItems[0]).toMatchObject({
      userId: 'eng-001',
      completionPercentage: 66.67
    });
    expect(result.initialReportAnalysis.feedbackItems[1]).toMatchObject({
      userId: 'eng-002',
      completionPercentage: 75.50
    });
    expect(result.initialReportAnalysis.feedbackItems[2]).toMatchObject({
      userId: 'eng-003',
      completionPercentage: 83.33
    });

    // Verify deployment schedule is generated
    expect(result.deploymentSchedule).toBeDefined();
    expect(result.deploymentSchedule.scheduledStartDate).toEqual(
      new Date('2024-01-22T00:00:00Z')
    );
    expect(result.deploymentSchedule.plannedProductionStartDate).toEqual(
      new Date('2024-02-05T00:00:00Z')
    );

    // Verify training materials are generated
    expect(result.trainingMaterials).toBeDefined();
    expect(Array.isArray(result.trainingMaterials)).toBe(true);

    // Verify AI client methods were called with correct parameters
    expect(mockAiClient.evaluateInitialReports).toHaveBeenCalledWith(
      expect.objectContaining({
        participantCount: 3,
        deadline: '09:00'
      })
    );

    // Verify rounding consistency: calculate manually and compare
    const manualAverage = (66.67 + 75.50 + 83.33) / 3;
    const expectedRounded = Math.round(manualAverage * 100) / 100; // Round to 2 decimals
    expect(result.initialReportAnalysis.dataQualityScore).toBe(expectedRounded);

    // Verify decimal precision: ensure no floating point arithmetic errors
    const scoreAsString = result.initialReportAnalysis.dataQualityScore.toString();
    const decimalPlaces = scoreAsString.split('.')[1]?.length || 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});