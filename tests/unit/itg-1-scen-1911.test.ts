import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の再発パターン分析機能', () => {
  // SCEN-1911
  test('[normal] 複数の類似度80%以上課題が存在する場合に全て同一グループで集約される', async () => {
    // Arrange: テストデータの準備
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    // 課題データ: 類似度80%以上でグループ化される課題A, B, C, E と、閾値未満の課題D
    const mockCourseData = [
      {
        issueId: 'issue-001',
        issueKeyword: 'DB接続エラー',
        occurrenceDate: '2024-01-05T09:30:00Z',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-002',
        issueKeyword: 'DB接続タイムアウト',
        occurrenceDate: '2024-01-08T14:15:00Z',
        teamId: 'team-001',
        similarityScore: 0.84 // 類似度84% >= 80%
      },
      {
        issueId: 'issue-003',
        issueKeyword: '接続エラー対応',
        occurrenceDate: '2024-01-12T10:45:00Z',
        teamId: 'team-001',
        similarityScore: 0.82 // 類似度82% >= 80%
      },
      {
        issueId: 'issue-004',
        issueKeyword: 'ネットワーク遅延',
        occurrenceDate: '2024-01-15T11:20:00Z',
        teamId: 'team-001',
        similarityScore: 0.79 // 類似度79% < 80% (閾値未満)
      },
      {
        issueId: 'issue-005',
        issueKeyword: 'DB接続失敗',
        occurrenceDate: '2024-01-18T16:00:00Z',
        teamId: 'team-001',
        similarityScore: 0.88 // 類似度88% >= 80%
      }
    ];

    // TextAnalysisServiceAdapter のモック
    const mockTextAnalysisClient: Tx8Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: mockCourseData.map(issue => ({
          keyword: issue.issueKeyword,
          frequency: 1,
          confidenceScore: 0.95
        }))
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high'
      }),
      groupBySimilarity: jest.fn().mockResolvedValue({
        groups: [
          {
            groupId: 'group-001',
            baseKeyword: 'DB接続エラー',
            memberIssues: [
              { issueId: 'issue-001', keyword: 'DB接続エラー', similarity: 1.0 },
              { issueId: 'issue-002', keyword: 'DB接続タイムアウト', similarity: 0.84 },
              { issueId: 'issue-003', keyword: '接続エラー対応', similarity: 0.82 },
              { issueId: 'issue-005', keyword: 'DB接続失敗', similarity: 0.88 }
            ]
          },
          {
            groupId: 'group-002',
            baseKeyword: 'ネットワーク遅延',
            memberIssues: [
              { issueId: 'issue-004', keyword: 'ネットワーク遅延', similarity: 1.0 }
            ]
          }
        ]
      }),
      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        pattern: '増加傾向',
        occurrenceCount: 4
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: '折れ線',
            title: 'DB接続エラー系課題の発生推移',
            dataPoints: [
              { date: '2024-01-05', count: 1 },
              { date: '2024-01-08', count: 2 },
              { date: '2024-01-12', count: 3 },
              { date: '2024-01-18', count: 4 }
            ]
          }
        ]
      }),
      sendReportEmail: jest.fn().mockResolvedValue({
        emailSentAt: '2024-01-31T17:30:00Z'
      })
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId
    };

    // Act: エージェント実行
    const result = await runTx8Imp1Agent(input, mockTextAnalysisClient);

    // Assert: グループ化結果の検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);

    // グループ化結果の検証: 類似度80%以上の課題が1つのグループに集約されていることを確認
    const groupedPatterns = result.recurringIssuePatterns;
    expect(groupedPatterns.length).toBeGreaterThanOrEqual(1);

    // 最初のグループが「DB接続エラー」系の課題を4件含むことを確認
    const dbConnectionGroup = groupedPatterns.find(p =>
      p.issueKeyword === 'DB接続エラー' || p.issueKeyword.includes('接続')
    );
    expect(dbConnectionGroup).toBeDefined();
    expect(dbConnectionGroup!.occurrenceCount).toBe(4); // A, B, C, E の4件

    // グラフ生成結果の検証
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThanOrEqual(1);

    const lineGraph = result.visualizationGraphs.find(g => g.graphType === '折れ線');
    expect(lineGraph).toBeDefined();
    expect(lineGraph!.dataPoints).toBeDefined();
    expect(Array.isArray(lineGraph!.dataPoints)).toBe(true);

    // メール送信結果の検証
    expect(result.emailSentAt).toBeDefined();
    expect(result.emailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // モッククライアントメソッドが期待通り呼び出されたことを確認
    expect(mockTextAnalysisClient.groupBySimilarity).toHaveBeenCalled();
    expect(mockTextAnalysisClient.analyzeTimeSeriesPattern).toHaveBeenCalled();
    expect(mockTextAnalysisClient.generateVisualizationGraphs).toHaveBeenCalled();
    expect(mockTextAnalysisClient.sendReportEmail).toHaveBeenCalled();
  });
});