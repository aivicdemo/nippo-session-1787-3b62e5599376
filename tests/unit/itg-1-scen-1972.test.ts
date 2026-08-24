import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1 agent: ボトルネック変化パターン可視化レポート生成', () => {
  test('SCEN-1972: 過去30日間の課題データ0件で、空の分析結果に対してレポートが生成される', async () => {
    const currentDate = new Date('2024-01-15T10:00:00Z');
    const analysisStartDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const analysisEndDate = currentDate.toISOString().split('T')[0];

    const mockAiClient: Tx8Imp1AiClient = {
      extractKeywordsFromReportedIssues: jest.fn().mockResolvedValue({
        keywords: [],
        extractionConfidence: 0,
      }),
      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        patterns: [],
        timeSeriesData: [],
      }),
      selectVisualizationGraphTypes: jest.fn().mockResolvedValue({
        graphTypes: [],
        visualizationData: [],
      }),
      generateRecurringIssuePatterns: jest.fn().mockResolvedValue({
        recurringPatterns: [],
        detectionConfidence: 0,
      }),
      calculatePriorityScoresForIssues: jest.fn().mockResolvedValue({
        priorityScores: [],
        scoringConfidence: 0,
      }),
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds: undefined,
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBe(0);

    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBe(0);

    expect(result.emailSentAt).toBeDefined();
    const emailSentTime = new Date(result.emailSentAt).getTime();
    const currentTime = currentDate.getTime();
    const timeDiff = Math.abs(emailSentTime - currentTime);
    expect(timeDiff).toBeLessThanOrEqual(60000);

    expect(mockAiClient.extractKeywordsFromReportedIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate,
        analysisEndDate,
      })
    );

    expect(mockAiClient.analyzeTimeSeriesPattern).toHaveBeenCalled();
    expect(mockAiClient.selectVisualizationGraphTypes).toHaveBeenCalled();
  });
});