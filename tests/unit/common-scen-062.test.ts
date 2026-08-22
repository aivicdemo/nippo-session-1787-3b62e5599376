import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  let mockAiClient: any;
  let mockEmailSender: any;
  let mockAuditLogger: any;

  beforeEach(() => {
    mockEmailSender = {
      send: jest.fn().mockResolvedValue({ messageId: 'msg_12345' })
    };

    mockAuditLogger = {
      log: jest.fn().mockResolvedValue(undefined)
    };

    mockAiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        version: 'ACTION_01_PROMPT_VERSION_1.0',
        content: '日報集約完了を確認するプロンプト'
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue({
        version: 'ACTION_02_PROMPT_VERSION_1.0',
        content: '課題自動抽出・優先度判定を実行するプロンプト'
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue({
        version: 'ACTION_03_PROMPT_VERSION_1.0',
        content: '課題抽出・優先度判定処理プロンプト'
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue({
        version: 'ACTION_04_PROMPT_VERSION_1.0',
        content: '優先度別課題一覧を部長に提示するプロンプト'
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue({
        version: 'ACTION_05_PROMPT_VERSION_1.0',
        content: '優先度別課題一覧メール送信プロンプト'
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-062
  test('should execute autonomous actions and send priority-classified issue list email to manager', async () => {
    const aggregatedReports = [
      {
        reportId: 'report_001',
        memberId: 'member_001',
        date: '2024-01-15',
        content: 'データベース接続タイムアウト発生。クエリ最適化が必要。',
        issues: ['database_performance']
      },
      {
        reportId: 'report_002',
        memberId: 'member_002',
        date: '2024-01-15',
        content: 'API応答遅延により顧客から苦情。負荷分散検討中。',
        issues: ['api_performance', 'customer_impact']
      },
      {
        reportId: 'report_003',
        memberId: 'member_003',
        date: '2024-01-15',
        content: '本日のビルド成功。全テスト合格。',
        issues: []
      }
    ];

    const managerEmail = 'manager@company.com';
    const priorityClassifiedIssues = [
      {
        priority: 'HIGH',
        issues: [
          {
            issueId: 'issue_001',
            description: 'API応答遅延により顧客から苦情。負荷分散検討中。',
            impact: 'customer_impact',
            frequency: 1,
            riskScore: 9.5
          }
        ]
      },
      {
        priority: 'MEDIUM',
        issues: [
          {
            issueId: 'issue_002',
            description: 'データベース接続タイムアウト発生。クエリ最適化が必要。',
            impact: 'database_performance',
            frequency: 2,
            riskScore: 6.5
          }
        ]
      },
      {
        priority: 'LOW',
        issues: []
      }
    ];

    const executionTimestamp = new Date('2024-01-15T09:00:00Z').toISOString();
    const sendTimestamp = new Date('2024-01-15T09:05:00Z').toISOString();

    mockAiClient.buildAction01Prompt.mockResolvedValueOnce({
      version: 'ACTION_01_PROMPT_VERSION_1.0',
      result: { status: 'confirmed', aggregationCount: 3 }
    });

    mockAiClient.buildAction02Prompt.mockResolvedValueOnce({
      version: 'ACTION_02_PROMPT_VERSION_1.0',
      result: {
        extractedIssues: [
          { id: 'issue_001', keyword: 'customer_impact' },
          { id: 'issue_002', keyword: 'database_performance' }
        ]
      }
    });

    mockAiClient.buildAction03Prompt.mockResolvedValueOnce({
      version: 'ACTION_03_PROMPT_VERSION_1.0',
      result: {
        classifiedIssues: priorityClassifiedIssues,
        classificationTimestamp: new Date('2024-01-15T09:02:00Z').toISOString()
      }
    });

    mockAiClient.buildAction04Prompt.mockResolvedValueOnce({
      version: 'ACTION_04_PROMPT_VERSION_1.0',
      result: {
        presentationReady: true,
        issueListFormatted: JSON.stringify(priorityClassifiedIssues)
      }
    });

    mockAiClient.buildAction05Prompt.mockResolvedValueOnce({
      version: 'ACTION_05_PROMPT_VERSION_1.0',
      result: {
        sendStatus: 'queued',
        targetEmail: managerEmail
      }
    });

    const result = await sendUnsubmittedReminder(
      aggregatedReports,
      managerEmail,
      {
        emailSender: mockEmailSender,
        auditLogger: mockAuditLogger,
        aiClient: mockAiClient
      }
    );

    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalledTimes(1);

    expect(mockEmailSender.send).toHaveBeenCalledTimes(1);
    expect(mockEmailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: managerEmail,
        subject: expect.stringContaining('優先度別課題一覧'),
        body: expect.stringContaining(JSON.stringify(priorityClassifiedIssues))
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 200,
        executionTimestamp: executionTimestamp,
        sendTimestamp: expect.any(String),
        messageId: 'msg_12345',
        actionsExecuted: 5
      })
    );

    expect(mockAuditLogger.log).toHaveBeenCalled();
    const auditCalls = mockAuditLogger.log.mock.calls;
    expect(auditCalls.length).toBeGreaterThanOrEqual(6);
    expect(auditCalls.some((call: any[]) =>
      call[0]?.actionName === 'action-01'
    )).toBe(true);
    expect(auditCalls.some((call: any[]) =>
      call[0]?.actionName === 'action-05' && call[0]?.eventType === 'email_sent'
    )).toBe(true);
  });
});