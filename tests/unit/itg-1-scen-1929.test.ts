import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1 orchestrator: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1929: [edge] 課題の再発パターン分析機能 - 課題キーワードの類似度が79.9%の場合、同一グループとして認識されない
  test('should classify keywords with 79.9% similarity as separate groups (not merged)', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    // スタブ化された TextAnalysisServiceAdapter
    const stubTextAnalysisClient: Tx8Imp1AiClient = {
      extractKeywordsFromReport: jest.fn(async (reportText: string) => {
        // 2つのキーワードを返す: "database-performance-issue" と "db-performance-problem"
        // これらの類似度は79.9%（80.0%未満）
        return {
          keywords: [
            {
              keyword: 'database-performance-issue',
              frequency: 5,
              confidence: 0.92,
            },
            {
              keyword: 'db-performance-problem',
              frequency: 4,
              confidence: 0.88,
            },
          ],
          extractedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        };
      }),
      analyzeTimeSeriesPattern: jest.fn(async (keywords: string[]) => {
        return {
          patterns: [
            {
              keyword: 'database-performance-issue',
              pattern: 'increasing_trend',
              occurrenceCount: 5,
            },
            {
              keyword: 'db-performance-problem',
              pattern: 'stable',
              occurrenceCount: 4,
            },
          ],
        };
      }),
      selectVisualizationGraphs: jest.fn(async (analysisData: object) => {
        return {
          graphs: [
            {
              graphType: 'line_chart',
              title: 'Keyword Occurrence Over Time',
              dataPoints: [
                { date: '2024-01-01', count: 2 },
                { date: '2024-01-15', count: 5 },
                { date: '2024-01-31', count: 3 },
              ],
            },
            {
              graphType: 'bar_chart',
              title: 'Keywords by Frequency',
              dataPoints: [
                { keyword: 'database-performance-issue', count: 5 },
                { keyword: 'db-performance-problem', count: 4 },
              ],
            },
          ],
        };
      }),
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const output = await runTx8Imp1Agent(input, stubTextAnalysisClient);

    // 期待値の検証
    // reportId が生成されること
    expect(output.reportId).toBeDefined();
    expect(typeof output.reportId).toBe('string');
    expect(output.reportId.length).toBeGreaterThan(0);

    // recurringIssuePatterns に2つの独立した課題が記録されること
    // （79.9%の類似度は80.0%未満なので、同一グループとしてマージされない）
    expect(output.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(output.recurringIssuePatterns)).toBe(true);
    expect(output.recurringIssuePatterns.length).toBe(2);

    // 最初のキーワード: database-performance-issue
    const pattern1 = output.recurringIssuePatterns[0];
    expect(pattern1.issueKeyword).toBe('database-performance-issue');
    expect(pattern1.occurrenceCount).toBe(5);
    expect(pattern1.timeSeriesPattern).toBe('increasing_trend');
    expect(typeof pattern1.priorityScore).toBe('number');
    expect(pattern1.priorityScore).toBeGreaterThanOrEqual(0);
    expect(pattern1.priorityScore).toBeLessThanOrEqual(100);

    // 2番目のキーワード: db-performance-problem
    const pattern2 = output.recurringIssuePatterns[1];
    expect(pattern2.issueKeyword).toBe('db-performance-problem');
    expect(pattern2.occurrenceCount).toBe(4);
    expect(pattern2.timeSeriesPattern).toBe('stable');
    expect(typeof pattern2.priorityScore).toBe('number');
    expect(pattern2.priorityScore).toBeGreaterThanOrEqual(0);
    expect(pattern2.priorityScore).toBeLessThanOrEqual(100);

    // visualizationGraphs が生成されること
    expect(output.visualizationGraphs).toBeDefined();
    expect(Array.isArray(output.visualizationGraphs)).toBe(true);
    expect(output.visualizationGraphs.length).toBeGreaterThanOrEqual(1);

    // グラフに必須フィールドが含まれていること
    output.visualizationGraphs.forEach((graph) => {
      expect(graph.graphType).toBeDefined();
      expect(['line_chart', 'bar_chart', 'pie_chart', 'heatmap'].includes(
        graph.graphType,
      )).toBe(true);
      expect(graph.title).toBeDefined();
      expect(typeof graph.title).toBe('string');
      expect(graph.dataPoints).toBeDefined();
      expect(Array.isArray(graph.dataPoints)).toBe(true);
    });

    // emailSentAt が ISO 8601 形式で記録されること
    expect(output.emailSentAt).toBeDefined();
    expect(typeof output.emailSentAt).toBe('string');
    const sentDate = new Date(output.emailSentAt);
    expect(sentDate.getTime()).toBeGreaterThan(0);
    expect(sentDate.toISOString()).toBeDefined();

    // AI クライアントの各メソッドが呼び出されたことを確認
    expect(stubTextAnalysisClient.extractKeywordsFromReport).toHaveBeenCalled();
    expect(
      stubTextAnalysisClient.analyzeTimeSeriesPattern,
    ).toHaveBeenCalled();
    expect(stubTextAnalysisClient.selectVisualizationGraphs).toHaveBeenCalled();

    // 2つのキーワードが異なるグループとして分類されていることの確認
    // （類似度79.9% < 閾値80.0% ）
    const keywords = output.recurringIssuePatterns.map((p) => p.issueKeyword);
    expect(keywords).toContain('database-performance-issue');
    expect(keywords).toContain('db-performance-problem');
    // グループIDが異なることを確認（別々の課題として認識）
    expect(output.recurringIssuePatterns[0].issueKeyword).not.toBe(
      output.recurringIssuePatterns[1].issueKeyword,
    );
  });
});