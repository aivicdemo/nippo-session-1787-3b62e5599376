import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - Invalid Timestamp Handling', () => {
  // SCEN-1230
  test('should reject invalid timestamp format and prevent external service calls', async () => {
    // Setup: Create mock AI client with required methods
    const mockAiClient = {
      analyzeAndValidateIssues: jest.fn(),
      determinePriority: jest.fn(),
      assessCategoryMapping: jest.fn(),
      executeToolIntegration: jest.fn(),
      prepareConfirmationEmail: jest.fn(),
    };

    // Setup: Create mock notification and text analysis adapters
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Input: Create test data with invalid timestamp format
    const invalidTimestampInput = {
      extractedIssueData: [
        {
          issueId: 'issue-001',
          title: 'Database connection timeout',
          description: 'System unable to connect to database',
          reportedAt: '2026-13-45T99:99:99Z', // Invalid: non-existent month, day, time
          severity: 'high' as const,
          teamId: 'team-001',
          reporterId: 'user-001',
        },
      ],
      toolIntegrationConfig: {
        targetTool: 'jira' as const,
        apiEndpoint: 'https://jira.example.com/api/v3',
        authToken: 'valid-token-12345',
        projectKey: 'PROJ',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        thresholds: {
          high: 70,
          medium: 40,
          low: 0,
        },
      },
      categoryMappings: [
        {
          systemCategory: 'database',
          toolCategory: 'Backend',
          priority: 'high',
        },
        {
          systemCategory: 'api',
          toolCategory: 'API',
          priority: 'medium',
        },
      ],
    };

    // Execute: Call agent with invalid timestamp
    let caughtError: Error | undefined;
    let result: any;

    try {
      result = await runTx5Imp1Agent(invalidTimestampInput, mockAiClient);
    } catch (error) {
      caughtError = error as Error;
    }

    // Assert: Verify timestamp validation error is thrown
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/タイムスタンプ|timestamp|形式|format/i);
    expect(caughtError?.message).toMatch(/ISO 8601|YYYY-MM-DD/i);

    // Assert: Verify external services were NOT called
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    // Assert: Verify no partial result was returned
    expect(result).toBeUndefined();

    // Assert: Verify error message contains actionable guidance
    expect(caughtError?.message).toContain('ISO 8601');
  });
});