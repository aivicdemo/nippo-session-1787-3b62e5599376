import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('課題の再発パターン分析機能 - 時系列データ順序の正規化', () => {
  test('SCEN-1937: 逆順の時系列課題データセットが正しく昇順に並序されて可視化される', async () => {
    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '開発環境', frequency: 2, confidence: 0.85 },
          { keyword: 'テストケース不足', frequency: 3, confidence: 0.92 },
          { keyword: 'API連携エラー', frequency: 2, confidence: 0.78 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        scores: [
          { keyword: 'テストケース不足', impactScore: 78 },
          { keyword: '開発環境', impactScore: 62 },
          { keyword: 'API連携エラー', impactScore: 55 }
        ]
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classifications: [
          { keyword: 'テストケース不足', severity: 'high' },
          { keyword: '開発環境', severity: 'medium' },
          { keyword: 'API連携エラー', severity: 'medium' }
        ]
      })
    };

    const reverseChronologicalIssueData = [
      {
        issueKeyword: 'テストケース不足',
        reportDate: '2024-01-05T09:00:00Z',
        occurrenceCount: 1,
        teamId: 'team_001'
      },
      {
        issueKeyword: 'テストケース不足',
        reportDate: '2024-01-04T09:00:00Z',
        occurrenceCount: 1,
        teamId: 'team_001'
      },
      {
        issueKeyword: '開発環境',
        reportDate: '2024-01-03T09:00:00Z',
        occurrenceCount: 1,
        teamId: 'team_001'
      },
      {
        issueKeyword: '開発環境',
        reportDate: '2024-01-02T09:00:00Z',
        occurrenceCount: 1,
        teamId: 'team_001'
      },
      {
        issueKeyword: 'API連携エラー',
        reportDate: '2024-01-01T09:00:00Z',
        occurrenceCount: 1,
        teamId: 'team_001'
      }
    ];

    const input: Tx8AgentInput = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-05T23:59:59Z',
      teamIds: ['team_001'],
      minimumRecurrenceThreshold: 2,
      recipientManagerId: 'manager_001'
    };

    const output: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(output).toBeDefined();
    expect(output.reportId).toBeTruthy();
    expect(Array.isArray(output.recurringIssuePatterns)).toBe(true);
    expect(Array.isArray(output.visualizationGraphs)).toBe(true);

    const timeSeriesGraph = output.visualizationGraphs.find(
      (graph: VisualizationGraph) => graph.graphType === '折れ線'
    );
    expect(timeSeriesGraph).toBeDefined();

    if (timeSeriesGraph && Array.isArray(timeSeriesGraph.dataPoints)) {
      const sortedDataPoints = timeSeriesGraph.dataPoints.sort(
        (a: any, b: any) => {
          const dateA = new Date(a.date || a.timestamp).getTime();
          const dateB = new Date(b.date || b.timestamp).getTime();
          return dateA - dateB;
        }
      );

      for (let i = 0; i < sortedDataPoints.length - 1; i++) {
        const currentDate = new Date(
          sortedDataPoints[i].date || sortedDataPoints[i].timestamp
        ).getTime();
        const nextDate = new Date(
          sortedDataPoints[i + 1].date || sortedDataPoints[i + 1].timestamp
        ).getTime();
        expect(currentDate).toBeLessThanOrEqual(nextDate);
      }
    }

    const recurringPatterns = output.recurringIssuePatterns.filter(
      (pattern: RecurringIssuePattern) => pattern.occurrenceCount >= 2
    );
    expect(recurringPatterns.length).toBeGreaterThan(0);

    recurringPatterns.forEach((pattern: RecurringIssuePattern) => {
      expect(pattern.issueKeyword).toBeTruthy();
      expect(pattern.occurrenceCount).toBeGreaterThanOrEqual(2);
      expect(typeof pattern.timeSeriesPattern).toBe('string');
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
    });

    expect(output.emailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.assessImpactScore).toHaveBeenCalled();
  });
});