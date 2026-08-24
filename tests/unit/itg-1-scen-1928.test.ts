import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput, RecurringIssuePattern } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の再発パターン分析機能 - 課題キーワード類似度80%時のグループ化', () => {
  test('SCEN-1928: 課題キーワードの類似度がちょうど80%の場合、同一グループとして認識される', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const recipientManagerId = 'manager-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        if (text.includes('DB接続タイムアウト')) {
          return {
            keywords: [
              { keyword: 'DB接続タイムアウト', frequency: 1, similarity: 80.0 }
            ],
            extractedAt: new Date().toISOString()
          };
        }
        return { keywords: [], extractedAt: new Date().toISOString() };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        return { keyword, impactScore: 75, confidenceScore: 0.85 };
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        return { severity: 'high', confidence: 0.9 };
      })
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        status: 'sent',
        deliveredAt: new Date().toISOString()
      })),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'delivered' }))
    };

    const existingKeywordGroupId = 'group-db-connection-001';
    const mockKeywordDatabase = [
      {
        id: 'kw-001',
        keyword: 'データベース接続エラー',
        groupId: existingKeywordGroupId,
        occurrenceCount: 3,
        lastOccurredAt: '2024-01-25T10:30:00Z'
      }
    ];

    const mockExtractedIssues = [
      {
        id: 'issue-001',
        keyword: 'DB接続タイムアウト',
        groupId: null,
        occurrenceCount: 1,
        similarity: 80.0,
        relatedKeywordId: 'kw-001',
        firstOccurredAt: '2024-01-30T14:15:00Z',
        lastOccurredAt: '2024-01-30T14:15:00Z'
      }
    ];

    const tx8Input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds: undefined,
      minimumRecurrenceThreshold: 3,
      recipientManagerId
    };

    const mockAiClient = {
      textAnalysisService: mockTextAnalysisAdapter,
      notificationService: mockNotificationAdapter,
      keywordDatabase: mockKeywordDatabase,
      extractedIssues: mockExtractedIssues
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(
      tx8Input,
      mockAiClient as any
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    const recurringPatterns = result.recurringIssuePatterns;
    expect(recurringPatterns).toBeDefined();
    expect(Array.isArray(recurringPatterns)).toBe(true);

    const dbConnectionPattern = recurringPatterns.find(
      (pattern: RecurringIssuePattern) =>
        pattern.issueKeyword === 'データベース接続エラー' ||
        pattern.issueKeyword === 'DB接続タイムアウト'
    );

    expect(dbConnectionPattern).toBeDefined();
    expect(dbConnectionPattern?.occurrenceCount).toBe(4);
    expect(dbConnectionPattern?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(dbConnectionPattern?.priorityScore).toBeLessThanOrEqual(100);
    expect(typeof dbConnectionPattern?.timeSeriesPattern).toBe('string');

    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    const graphWithGroupedKeywords = result.visualizationGraphs.find(
      (graph) =>
        graph.dataPoints &&
        Array.isArray(graph.dataPoints) &&
        graph.dataPoints.some(
          (point: any) =>
            (point.keyword === 'DB接続タイムアウト' ||
              point.keyword === 'データベース接続エラー') &&
            point.groupId === existingKeywordGroupId
        )
    );

    expect(graphWithGroupedKeywords).toBeDefined();

    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);
    expect(emailSentDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});