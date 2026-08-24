import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('runTx5Imp1Agent - 既存ツール連携API失敗時の自動リトライ・通知機能', () => {
  // SCEN-1279: 既存ツール連携API失敗時の自動リトライ・通知機能 - リトライ回数がちょうど3回で指数バックオフが完了し、3回目失敗時に部長への手動対応通知が実行される

  let notificationCallCount: number;
  let notificationTimestamps: Date[];
  let emailAlertSent: boolean;
  let alertEmailContent: { to: string; subject: string; body: string } | null;
  let timerQueue: Array<{ delayMs: number; callback: () => void }>;
  let currentSimulatedTime: Date;

  beforeEach(() => {
    notificationCallCount = 0;
    notificationTimestamps = [];
    emailAlertSent = false;
    alertEmailContent = null;
    timerQueue = [];
    currentSimulatedTime = new Date('2024-01-15T09:00:00Z');

    jest.useFakeTimers();
    jest.setSystemTime(currentSimulatedTime);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('3回のリトライ失敗後に部長への手動対応通知が実行される', async () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockImplementation(async () => {
        notificationCallCount++;
        notificationTimestamps.push(new Date(currentSimulatedTime.getTime()));
        
        if (notificationCallCount <= 3) {
          const error = new Error('API Error: 503 Service Unavailable');
          (error as any).statusCode = 503;
          throw error;
        }
        
        return { status: 'sent', deliveryId: 'notif-123' };
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'failed', retryCount: 3 }),
    };

    const mockNotificationLogger = {
      logNotificationAttempt: jest.fn().mockResolvedValue(undefined),
      queryNotificationLog: jest.fn().mockResolvedValue([
        {
          id: 'log-1',
          userId: 'user-001',
          attemptNumber: 1,
          timestamp: new Date('2024-01-15T09:00:00Z'),
          status: 'failed',
          errorCode: 503,
        },
        {
          id: 'log-2',
          userId: 'user-001',
          attemptNumber: 2,
          timestamp: new Date('2024-01-15T09:05:00Z'),
          status: 'failed',
          errorCode: 503,
        },
        {
          id: 'log-3',
          userId: 'user-001',
          attemptNumber: 3,
          timestamp: new Date('2024-01-15T09:20:00Z'),
          status: 'failed',
          errorCode: 503,
        },
      ]),
    };

    const mockEmailService = {
      sendAlert: jest.fn().mockImplementation(async (to: string, subject: string, body: string) => {
        emailAlertSent = true;
        alertEmailContent = { to, subject, body };
        return { messageId: 'email-alert-001' };
      }),
    };

    const mockRetryConfig = {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 5000,
    };

    const mockTimerService = {
      scheduleRetry: jest.fn().mockImplementation((delayMs: number, callback: () => void) => {
        timerQueue.push({ delayMs, callback });
        setTimeout(() => {
          currentSimulatedTime = new Date(currentSimulatedTime.getTime() + delayMs);
          jest.setSystemTime(currentSimulatedTime);
          callback();
        }, delayMs);
      }),
    };

    const input = {
      extractedIssueData: [
        {
          issueId: 'issue-001',
          title: 'Database connection timeout',
          description: 'Connection to DB timed out',
          category: 'infrastructure',
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://api.jira.example.com',
        authToken: 'mock-token-xyz',
      },
      priorityRules: {
        frequencyWeight: 0.3,
        impactWeight: 0.7,
        frequencyThresholds: { high: 5, medium: 2 },
      },
      categoryMappings: [
        { sourceCategory: 'infrastructure', targetCategory: 'Operations' },
      ],
    };

    const mockAiClient = {
      validateIssueData: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'issue-001',
            priorityScore: 85,
            priorityRank: 'high' as const,
            category: 'Operations',
            toolIssueId: null,
            validationStatus: 'valid' as const,
          },
        ],
      }),
      judgeIssuePriority: jest.fn().mockResolvedValue({
        priorityJudgment: [
          {
            issueId: 'issue-001',
            priorityScore: 85,
            category: 'Operations',
          },
        ],
      }),
      attemptToolIntegration: jest.fn().mockRejectedValue(new Error('503 Service Unavailable')),
    };

    try {
      await runTx5Imp1Agent(input, mockAiClient as any, {
        notificationAdapter: mockNotificationAdapter,
        notificationLogger: mockNotificationLogger,
        emailService: mockEmailService,
        retryConfig: mockRetryConfig,
        timerService: mockTimerService,
      } as any);
    } catch (err) {
      // リトライ完全失敗後のエラーをキャッチ
    }

    // シミュレートされたタイムを進める
    jest.advanceTimersByTime(5000); // 1回目リトライまで
    jest.advanceTimersByTime(10000); // 2回目リトライまで（5分 + 15分 = 20秒の合計）
    jest.advanceTimersByTime(60000); // 3回目リトライまで

    // 検証: NotificationServiceAdapterが正確に3回呼ばれていること
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);

    // 検証: 通知ログが3件記録されていること
    const logs = await mockNotificationLogger.queryNotificationLog();
    expect(logs).toHaveLength(3);
    expect(logs[0]).toMatchObject({
      attemptNumber: 1,
      status: 'failed',
      errorCode: 503,
      timestamp: new Date('2024-01-15T09:00:00Z'),
    });
    expect(logs[1]).toMatchObject({
      attemptNumber: 2,
      status: 'failed',
      errorCode: 503,
      timestamp: new Date('2024-01-15T09:05:00Z'),
    });
    expect(logs[2]).toMatchObject({
      attemptNumber: 3,
      status: 'failed',
      errorCode: 503,
      timestamp: new Date('2024-01-15T09:20:00Z'),
    });

    // 検証: 部長へのアラートメールが送信されていること
    expect(mockEmailService.sendAlert).toHaveBeenCalledTimes(1);
    expect(alertEmailContent).not.toBeNull();
    expect(alertEmailContent!.to).toMatch(/manager|director|head/i);
    expect(alertEmailContent!.subject).toMatch(/リマインド通知配信/);
    expect(alertEmailContent!.body).toMatch(/user-001/);
    expect(alertEmailContent!.body).toMatch(/2024-01-15T09:20:00/);
    expect(alertEmailContent!.body).toMatch(/3回の再試行後も失敗/);

    // 検証: 3回目のリトライ失敗後、さらなるリトライが実行されていないこと
    expect(notificationCallCount).toBe(3);
  });
});