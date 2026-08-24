import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('課題の再発パターン分析機能 - グループ化と可視化', () => {
  // SCEN-1912
  test('同一キーワード課題と類似度80%以上課題が混在する場合に同一グループで集約される', async () => {
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'mgr_001';

    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          occurrenceCount: 5,
          relatedIssueIds: ['issue_001', 'issue_002'],
        },
        {
          keyword: 'DB接続タイムアウト',
          occurrenceCount: 3,
          relatedIssueIds: ['issue_003'],
        },
        {
          keyword: 'ネットワーク遅延',
          occurrenceCount: 2,
          relatedIssueIds: ['issue_004'],
        },
      ]),
      assessImpactScore: jest.fn().mockImplementation(async (keyword: string) => {
        const scoreMap: Record<string, number> = {
          'データベース接続エラー': 85,
          'DB接続タイムアウト': 80,
          'ネットワーク遅延': 45,
        };
        return { keyword, impactScore: scoreMap[keyword] || 0 };
      }),
      calculateSimilarityScore: jest.fn().mockImplementation(async (keyword1: string, keyword2: string) => {
        if (keyword1 === 'データベース接続エラー' && keyword2 === 'DB接続タイムアウト') {
          return { similarity: 0.82 };
        }
        if (keyword1 === 'データベース接続エラー' && keyword2 === 'ネットワーク遅延') {
          return { similarity: 0.60 };
        }
        if (keyword1 === keyword2) {
          return { similarity: 1.0 };
        }
        return { similarity: 0.5 };
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue([
        {
          graphType: '折れ線',
          title: 'DB関連エラーの発生頻度推移',
          dataPoints: [
            { date: '2024-01-08', count: 2 },
            { date: '2024-01-09', count: 3 },
            { date: '2024-01-10', count: 2 },
            { date: '2024-01-11', count: 1 },
          ],
        },
        {
          graphType: '棒',
          title: '課題別発生件数',
          dataPoints: [
            { category: 'DB関連エラー', count: 8 },
            { category: 'ネットワーク遅延', count: 2 },
          ],
        },
      ]),
      generateMailContent: jest.fn().mockResolvedValue({
        subject: '課題再発パターン分析レポート（2024年1月8日～14日）',
        body: '添付のレポートをご確認ください',
      }),
    };

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds: ['team_001'],
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(result.emailSentAt).toBeTruthy();

    expect(result.recurringIssuePatterns).toHaveLength(2);

    const dbGroup = result.recurringIssuePatterns[0];
    expect(dbGroup.issueKeyword).toBe('データベース接続エラー');
    expect(dbGroup.occurrenceCount).toBe(8);
    expect(dbGroup.priorityScore).toBe(85);
    expect(dbGroup.timeSeriesPattern).toBeTruthy();

    const networkGroup = result.recurringIssuePatterns[1];
    expect(networkGroup.issueKeyword).toBe('ネットワーク遅延');
    expect(networkGroup.occurrenceCount).toBe(2);
    expect(networkGroup.priorityScore).toBe(45);

    expect(result.visualizationGraphs).toHaveLength(2);

    const lineGraph = result.visualizationGraphs[0];
    expect(lineGraph.graphType).toBe('折れ線');
    expect(lineGraph.title).toBe('DB関連エラーの発生頻度推移');
    expect(lineGraph.dataPoints).toHaveLength(4);

    const barGraph = result.visualizationGraphs[1];
    expect(barGraph.graphType).toBe('棒');
    expect(barGraph.title).toBe('課題別発生件数');
    expect(barGraph.dataPoints).toHaveLength(2);

    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.assessImpactScore).toHaveBeenCalledWith('データベース接続エラー');
    expect(mockAiClient.assessImpactScore).toHaveBeenCalledWith('DB接続タイムアウト');
    expect(mockAiClient.assessImpactScore).toHaveBeenCalledWith('ネットワーク遅延');
    expect(mockAiClient.calculateSimilarityScore).toHaveBeenCalled();
    expect(mockAiClient.generateVisualizationGraphs).toHaveBeenCalled();
    expect(mockAiClient.generateMailContent).toHaveBeenCalled();

    const mailContentCall = mockAiClient.generateMailContent.mock.calls[0];
    expect(mailContentCall[0].recipientManagerId).toBe(recipientManagerId);
  });
});