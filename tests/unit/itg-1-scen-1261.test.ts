import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1261: [normal] 既存ツール連携API失敗時の自動リトライ機能 - 2回目リトライ失敗後、指数バックオフで3回目リトライが正常に実行される
  test('should retry notification delivery with exponential backoff and succeed on third attempt after two failures', async () => {
    const retryAttempts: Array<{ attemptNumber: number; timestamp: number; statusCode: number }> = [];
    let currentAttempt = 0;

    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        currentAttempt += 1;
        const now = Date.now();
        
        if (currentAttempt === 1) {
          retryAttempts.push({ attemptNumber: 1, timestamp: now, statusCode: 500 });
          return {
            success: false,
            statusCode: 500,
            deliveryStatus: 'failed',
            userId,
            sentAt: new Date(now).toISOString(),
          };
        }
        
        if (currentAttempt === 2) {
          retryAttempts.push({ attemptNumber: 2, timestamp: now, statusCode: 503 });
          return {
            success: false,
            statusCode: 503,
            deliveryStatus: 'failed',
            userId,
            sentAt: new Date(now).toISOString(),
          };
        }
        
        retryAttempts.push({ attemptNumber: 3, timestamp: now, statusCode: 200 });
        return {
          success: true,
          statusCode: 200,
          deliveryStatus: 'success',
          userId,
          sentAt: new Date(now).toISOString(),
        };
      }),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'success' })),
    };

    const mockAiClient: Tx5Imp1AiClient = {
      generateValidationPrompt: jest.fn(async () => 'mock prompt'),
      generatePriorityPrompt: jest.fn(async () => 'mock prompt'),
      generateCategoryPrompt: jest.fn(async () => 'mock prompt'),
      generateToolIntegrationPrompt: jest.fn(async () => 'mock prompt'),
      generateRetryPrompt: jest.fn(async () => 'mock prompt'),
    };

    const mockIntegrationRetryConfig = {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 300000, // 5 minutes
    };

    const extractedIssueData = [
      {
        issueId: 'ISSUE-001',
        title: 'Database connection timeout',
        description: 'Connection pool exhausted',
        severity: 'high',
        reportedAt: '2024-01-15T09:00:00Z',
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://api.jira.example.com',
      projectKey: 'DEV',
      authToken: 'mock-token',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings = [
      {
        systemCategory: 'performance',
        toolCategory: 'Performance',
      },
      {
        systemCategory: 'reliability',
        toolCategory: 'Reliability',
      },
    ];

    const notificationLog: Array<{
      issueId: string;
      attemptNumber: number;
      statusCode: number;
      deliveryStatus: string;
      timestamp: string;
    }> = [];

    const agent = runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
        retryConfig: mockIntegrationRetryConfig,
        targetUserId: 'USER-PM-001',
        notificationAdapter: mockNotificationAdapter,
      },
      mockAiClient,
      {
        onRetryAttempt: (issueId: string, attemptNumber: number, statusCode: number, deliveryStatus: string) => {
          notificationLog.push({
            issueId,
            attemptNumber,
            statusCode,
            deliveryStatus,
            timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
          });
        },
      }
    );

    const result = await agent;

    expect(currentAttempt).toBe(3);
    expect(retryAttempts).toHaveLength(3);
    
    expect(retryAttempts[0]).toEqual({
      attemptNumber: 1,
      timestamp: expect.any(Number),
      statusCode: 500,
    });
    
    expect(retryAttempts[1]).toEqual({
      attemptNumber: 2,
      timestamp: expect.any(Number),
      statusCode: 503,
    });
    
    expect(retryAttempts[2]).toEqual({
      attemptNumber: 3,
      timestamp: expect.any(Number),
      statusCode: 200,
    });

    expect(notificationLog).toHaveLength(3);
    
    expect(notificationLog[0]).toMatchObject({
      attemptNumber: 1,
      statusCode: 500,
      deliveryStatus: 'failed',
    });
    
    expect(notificationLog[1]).toMatchObject({
      attemptNumber: 2,
      statusCode: 503,
      deliveryStatus: 'failed',
    });
    
    expect(notificationLog[2]).toMatchObject({
      attemptNumber: 3,
      statusCode: 200,
      deliveryStatus: 'success',
    });

    expect(result.validatedIssues).toBeDefined();
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBeGreaterThanOrEqual(0);
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.finalStatus).toBe('completed');
  });
});