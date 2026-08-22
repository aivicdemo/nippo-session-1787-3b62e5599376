import { generateWeeklyAnalysisReport } from '../../src/logic/analysis-reporting';

describe('generateWeeklyAnalysisReport', () => {
  // SCEN-096
  test('should escalate when priority confidence score is below threshold before side effects are executed', async () => {
    const extractedIssueData = {
      issueId: 'issue-001',
      title: 'Database Performance Degradation',
      description: 'Query response time exceeded 5 seconds',
      category: 'performance',
      severity: 'high',
      affectedSystems: ['payment-service'],
      firstDetectedAt: '2024-01-15T09:30:00Z',
      frequency: 3,
    };

    const fakeAiClient = {
      validateIssueFormat: jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
      }),
      judgeIssuePriorityAndCategory: jest.fn().mockResolvedValue({
        priority: 'high',
        category: 'performance',
        confidenceScore: 0.45,
      }),
      executeToolIntegration: jest.fn().mockResolvedValue({
        success: true,
        toolId: 'jira-001',
      }),
      notifyHumanReviewer: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'sent',
      }),
    };

    const result = await generateWeeklyAnalysisReport(
      extractedIssueData,
      fakeAiClient,
      { confidenceThreshold: 0.5 }
    );

    expect(result.status).toBe('escalated');
    expect(result.escalationReason).toBe('優先度判定の信頼度が閾値以下');
    expect(result.confidenceScore).toBe(0.45);
    expect(result.threshold).toBe(0.5);
    expect(result.sideEffectsExecuted).toBe(false);
    expect(result.extractedIssueData).toEqual(extractedIssueData);
    expect(result.assigneeForReview).toBe('human_reviewer');

    expect(fakeAiClient.validateIssueFormat).toHaveBeenCalledWith(
      extractedIssueData
    );
    expect(fakeAiClient.judgeIssuePriorityAndCategory).toHaveBeenCalledWith(
      extractedIssueData
    );
    expect(fakeAiClient.executeToolIntegration).not.toHaveBeenCalled();
    expect(fakeAiClient.notifyHumanReviewer).toHaveBeenCalledWith({
      reason: '優先度判定の信頼度が閾値以下',
      confidenceScore: 0.45,
      threshold: 0.5,
      issueData: extractedIssueData,
      escalationTime: expect.any(String),
    });
  });
});