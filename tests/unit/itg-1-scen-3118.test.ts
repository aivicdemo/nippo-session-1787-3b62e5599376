import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1 orchestrator: 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  // SCEN-3118
  test('runTx3Imp1Agent が集約済み日報から課題を抽出・優先度判定してメール送信を完結する', async () => {
    const now = new Date('2024-01-15T09:00:00Z');
    const executionId = 'exec-tx3-imp1-20240115-001';
    const aggregatedReportIds = ['report-001', 'report-002', 'report-003'];
    const analysisStartDate = '2024-01-15';
    const analysisEndDate = '2024-01-15';
    const managerUserId = 'user-manager-001';
    const priorityThresholdScore = 70;

    const mockIssueKeywords = [
      {
        keyword: 'データベース接続タイムアウト',
        frequency: 3,
        impactScore: 85,
        category: 'インフラ',
      },
      {
        keyword: 'API仕様の曖昧さ',
        frequency: 2,
        impactScore: 60,
        category: 'API設計',
      },
      {
        keyword: 'テストカバレッジ不足',
        frequency: 4,
        impactScore: 75,
        category: 'QA',
      },
    ];

    const mockCategorizedIssues = [
      {
        issueId: 'issue-001',
        keyword: 'データベース接続タイムアウト',
        category: 'インフラ',
        frequency: 3,
        impactScore: 85,
      },
      {
        issueId: 'issue-002',
        keyword: 'API仕様の曖昧さ',
        category: 'API設計',
        frequency: 2,
        impactScore: 60,
      },
      {
        issueId: 'issue-003',
        keyword: 'テストカバレッジ不足',
        category: 'QA',
        frequency: 4,
        impactScore: 75,
      },
    ];

    const mockPrioritizedIssues = [
      {
        issueId: 'issue-001',
        keyword: 'データベース接続タイムアウト',
        category: 'インフラ',
        frequency: 3,
        impactScore: 85,
        priorityRank: '高',
        priorityScore: 90,
      },
      {
        issueId: 'issue-003',
        keyword: 'テストカバレッジ不足',
        category: 'QA',
        frequency: 4,
        impactScore: 75,
        priorityRank: '高',
        priorityScore: 80,
      },
      {
        issueId: 'issue-002',
        keyword: 'API仕様の曖昧さ',
        category: 'API設計',
        frequency: 2,
        impactScore: 60,
        priorityRank: '中',
        priorityScore: 65,
      },
    ];

    const mockSummaryReport = {
      reportId: 'summary-report-20240115',
      title: '2024-01-15 優先度別課題一覧',
      generatedAt: '2024-01-15T09:00:00Z',
      highPriorityIssues: [
        {
          issueId: 'issue-001',
          keyword: 'データベース接続タイムアウト',
          priorityScore: 90,
        },
        {
          issueId: 'issue-003',
          keyword: 'テストカバレッジ不足',
          priorityScore: 80,
        },
      ],
      mediumPriorityIssues: [
        {
          issueId: 'issue-002',
          keyword: 'API仕様の曖昧さ',
          priorityScore: 65,
        },
      ],
      lowPriorityIssues: [],
      totalIssuesCount: 3,
    };

    const mockEmailSendResult = {
      messageId: 'msg-tx3-imp1-001',
      recipient: 'manager@company.com',
      subject: '【朝会報告】2024-01-15 課題優先度別一覧',
      sentAt: '2024-01-15T09:00:00Z',
      status: 'success',
    };

    const auditLogRecords: Array<{
      timestamp: string;
      actionType: string;
      description: string;
      executionId: string;
      status: string;
    }> = [];

    const fakeAiClient: Tx3Imp1AiClient = {
      action01ExtractKeywords: jest.fn().mockResolvedValue({
        keywords: mockIssueKeywords,
        confidence: 0.92,
      }),

      action02CategorizeIssues: jest.fn().mockResolvedValue({
        categorizedIssues: mockCategorizedIssues,
        validationScore: 0.88,
      }),

      action03PrioritizeIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: mockPrioritizedIssues,
        priorityScoreDistribution: {
          high: 2,
          medium: 1,
          low: 0,
        },
      }),

      action04GenerateSummary: jest.fn().mockResolvedValue({
        summaryReport: mockSummaryReport,
        formattingScore: 0.95,
      }),

      action05SendEmail: jest.fn().mockImplementation(async (emailParams) => {
        const auditRecord = {
          timestamp: now.toISOString(),
          actionType: 'AGENT_ACTION_EXECUTED: Action 5 - Send Mail to Department Head',
          description: `Manager email sent for execution ${executionId}`,
          executionId: executionId,
          status: 'success',
        };
        auditLogRecords.push(auditRecord);

        return {
          messageId: mockEmailSendResult.messageId,
          recipient: mockEmailSendResult.recipient,
          subject: mockEmailSendResult.subject,
          sentAt: mockEmailSendResult.sentAt,
          status: mockEmailSendResult.status,
        };
      }),
    };

    const input = {
      aggregatedReportIds,
      analysisStartDate,
      analysisEndDate,
      managerUserId,
      priorityThresholdScore,
    };

    const contextInput = {
      executingUserId: 'system-agent',
      teamId: 'team-dev-001',
      retryAttempt: 0,
    };

    const result = await runTx3Imp1Agent(input, fakeAiClient, contextInput, now);

    expect(result.executionId).toBe(executionId);
    expect(result.extractedIssuesCount).toBe(3);

    expect(result.prioritizedIssuesList).toHaveLength(3);
    expect(result.prioritizedIssuesList[0]).toEqual({
      issueId: 'issue-001',
      keyword: 'データベース接続タイムアウト',
      category: 'インフラ',
      frequency: 3,
      impactScore: 85,
      priorityRank: '高',
      priorityScore: 90,
    });
    expect(result.prioritizedIssuesList[1]).toEqual({
      issueId: 'issue-003',
      keyword: 'テストカバレッジ不足',
      category: 'QA',
      frequency: 4,
      impactScore: 75,
      priorityRank: '高',
      priorityScore: 80,
    });
    expect(result.prioritizedIssuesList[2]).toEqual({
      issueId: 'issue-002',
      keyword: 'API仕様の曖昧さ',
      category: 'API設計',
      frequency: 2,
      impactScore: 60,
      priorityRank: '中',
      priorityScore: 65,
    });

    expect(result.emailSendStatus).toBe('success');
    expect(result.completionTimestamp).toBe('2024-01-15T09:00:00Z');

    expect(fakeAiClient.action01ExtractKeywords).toHaveBeenCalledWith(
      aggregatedReportIds,
      analysisStartDate,
      analysisEndDate
    );

    expect(fakeAiClient.action02CategorizeIssues).toHaveBeenCalledWith(
      mockIssueKeywords
    );

    expect(fakeAiClient.action03PrioritizeIssues).toHaveBeenCalledWith(
      mockCategorizedIssues,
      {
        highPriorityMinScore: priorityThresholdScore,
        mediumPriorityMinScore: 50,
      }
    );

    expect(fakeAiClient.action04GenerateSummary).toHaveBeenCalledWith(
      mockPrioritizedIssues
    );

    expect(fakeAiClient.action05SendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: managerUserId,
        subject: expect.stringContaining('課題優先度別一覧'),
        body: expect.stringContaining('優先度：高'),
        summaryReport: mockSummaryReport,
      })
    );

    expect(auditLogRecords).toHaveLength(1);
    expect(auditLogRecords[0]).toEqual(
      expect.objectContaining({
        actionType: 'AGENT_ACTION_EXECUTED: Action 5 - Send Mail to Department Head',
        executionId: executionId,
        status: 'success',
      })
    );
  });
});