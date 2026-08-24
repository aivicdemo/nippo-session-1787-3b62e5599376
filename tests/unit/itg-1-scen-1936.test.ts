import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題再発パターン分析 - 類似度80%以上の重複排除と発生頻度集計', () => {
  test('SCEN-1936: グループ内の同値キーワード排除後、発生頻度が正しく計算される', async () => {
    // Arrange
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-31';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockTextAnalysisClient: Tx8Imp1AiClient = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'ログイン機能', frequency: 1, confidence: 0.95 },
          { keyword: 'ログイン画面', frequency: 1, confidence: 0.92 },
          { keyword: 'ログイン認証', frequency: 1, confidence: 0.88 },
          { keyword: 'ログイン処理', frequency: 1, confidence: 0.90 },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        severity: 'high',
      }),
    };

    const mockNotificationClient = {
      sendReminderNotification: jest.fn().mockResolvedValue({ sent: true }),
    };

    // Act
    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      },
      mockTextAnalysisClient,
      mockNotificationClient
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);

    const loginPatterns = result.recurringIssuePatterns.filter(
      (pattern) =>
        pattern.issueKeyword.includes('ログイン') ||
        pattern.issueKeyword === 'ログイン関連'
    );

    expect(loginPatterns.length).toBeGreaterThan(0);

    const mergedPattern = loginPatterns[0];
    expect(mergedPattern.occurrenceCount).toBe(4);
    expect(typeof mergedPattern.priorityScore).toBe('number');
    expect(mergedPattern.priorityScore).toBeGreaterThanOrEqual(0);
    expect(mergedPattern.priorityScore).toBeLessThanOrEqual(100);

    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    const firstGraph = result.visualizationGraphs[0];
    expect(firstGraph.graphType).toBeDefined();
    expect(['折れ線', '棒', '円', 'ヒートマップ']).toContain(firstGraph.graphType);
    expect(firstGraph.title).toBeDefined();
    expect(firstGraph.dataPoints).toBeDefined();
    expect(Array.isArray(firstGraph.dataPoints)).toBe(true);

    expect(result.emailSentAt).toBeDefined();
    const emailDate = new Date(result.emailSentAt);
    expect(emailDate.getTime()).toBeGreaterThan(0);

    expect(mockTextAnalysisClient.extractKeywords).toHaveBeenCalled();
  });
});