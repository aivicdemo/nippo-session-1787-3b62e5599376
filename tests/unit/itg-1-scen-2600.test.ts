import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 orchestrator - initial report data quality assessment', () => {
  // SCEN-2600
  test('should throw error when submission rate is string instead of number', async () => {
    const mockAiClient = {
      analyzeReportQuality: jest.fn(),
      assessSubmissionRate: jest.fn(),
      evaluateDataQualityScore: jest.fn(),
      evaluateFormatUniformityScore: jest.fn(),
      generateFeedbackItems: jest.fn(),
    };

    const testReportData = {
      yesterdayCompleted: 'タスクA完了',
      todayPlanned: 'タスクB予定',
      currentIssues: '課題C',
      submissionRate: '85%',
      dataQualityScore: 82,
      formatUniformityScore: 88,
    };

    const orchestratorInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
      participantList: [
        {
          userId: 'user001',
          role: 'Engineer',
          email: 'eng001@example.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    expect(() =>
      runTx10Imp1Agent(orchestratorInput, mockAiClient)
    ).toThrow(/提出率|型|数値/);
  });
});