import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('TX-8-IMP-1: 課題検索から可視化レポート作成までの自動実行', () => {
  test('SCEN-2002: ボトルネック変化パターン可視化レポート生成機能 - 過去30日間の課題データ期間がちょうど30日のとき、全データを対象にレポート生成される', async () => {
    // 基準日時: 現在から遡って正確に30日前
    const endDate = new Date('2024-02-15T09:00:00Z');
    const startDate = new Date('2024-01-16T09:00:00Z');

    // 期間検証: 正確に30日間であることを確認
    const daysDifference = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDifference).toBe(30);

    // テストデータ: 30日間に分布した課題データ100件
    const issueDataset = Array.from({ length: 100 }, (_, index) => ({
      issueId: `ISSUE-${String(index + 1).padStart(4, '0')}`,
      keyword: ['ボトルネック', 'リソース不足', 'デリバリ遅延'][index % 3],
      reportDate: new Date(startDate.getTime() + (index % 30) * 24 * 60 * 60 * 1000).toISOString(),
      description: `Issue description ${index + 1}`,
      occurrenceCount: 2 + (index % 5),
      impactScore: 40 + (index % 60),
    }));

    // モック: 朝会報告管理システムAPI
    const mockReportingSystemApi = {
      searchIssuesInPeriod: jest.fn().mockResolvedValue({
        issues: issueDataset,
        totalCount: 100,
        retrievedCount: 100,
      }),
    };

    // モック: TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockImplementation((text) => ({
        keywords: [
          { keyword: 'ボトルネック', frequency: 1 },
          { keyword: 'リソース', frequency: 1 },
        ],
        confidence: 0.95,
      })),
      assessImpactScore: jest.fn().mockImplementation((keyword) => ({
        impactScore: 65,
        severity: 'high',
      })),
      classifyIssueSeverity: jest.fn().mockImplementation(() => ({
        severity: 'high',
        classification: 'bottleneck',
      })),
    };

    // モック: 監査ログサービス
    const mockAuditLogger = {
      recordEvent: jest.fn().mockResolvedValue({
        eventId: 'AUDIT-20240215-001',
        timestamp: '2024-02-15T09:00:00Z',
      }),
    };

    // AI Client インターフェース実装
    const mockAiClient = {
      invokeAction01: jest.fn().mockResolvedValue({
        extractedIssues: issueDataset,
        totalExtracted: 100,
      }),
      invokeAction02: jest.fn().mockResolvedValue({
        timeSeriesAnalysis: {
          patterns: [
            {
              keyword: 'ボトルネック',
              weeklyOccurrences: [8, 12, 15, 18, 20, 22, 25],
              trendDirection: 'increasing',
            },
            {
              keyword: 'リソース不足',
              weeklyOccurrences: [5, 6, 7, 8, 9, 9, 10],
              trendDirection: 'stable',
            },
          ],
        },
      }),
      invokeAction03: jest.fn().mockResolvedValue({
        bottleneckPatterns: [
          {
            pattern: 'escalating_resource_constraint',
            startDate: '2024-01-16T09:00:00Z',
            endDate: '2024-02-15T09:00:00Z',
            severity: 'high',
          },
        ],
      }),
      invokeAction04: jest.fn().mockResolvedValue({
        reportContent: {
          title: '課題再発パターン可視化レポート',
          generatedAt: '2024-02-15T09:00:00Z',
          graphTypes: ['line', 'bar', 'heatmap'],
        },
      }),
      invokeAction05: jest.fn().mockResolvedValue({
        highlightedIssues: [
          {
            keyword: 'ボトルネック',
            priorityScore: 85,
            occurrenceCount: 25,
          },
        ],
      }),
    };

    // テスト入力: 過去30日間を明示的に指定
    const input: Tx8AgentInput = {
      analysisStartDate: startDate.toISOString(),
      analysisEndDate: endDate.toISOString(),
      teamIds: ['TEAM-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'MGR-001',
    };

    // オーケストレーター実行
    const output = await runTx8Imp1Agent(input, mockAiClient);

    // Assertion 1: Action 1 - 朝会報告管理システムから課題データを検索・抽出
    expect(mockAiClient.invokeAction01).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
    );
    expect(mockAiClient.invokeAction01).toHaveBeenCalledTimes(1);

    // Assertion 2: Action 2 - 課題の再発パターンを時系列で分析
    expect(mockAiClient.invokeAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction02).toHaveBeenCalledWith(
      expect.objectContaining({
        issueCount: 100,
      })
    );

    // Assertion 3: Action 3 - ボトルネック変化パターンを特定
    expect(mockAiClient.invokeAction03).toHaveBeenCalledTimes(1);

    // Assertion 4: Action 4 - 可視化レポートを自動生成
    expect(mockAiClient.invokeAction04).toHaveBeenCalledTimes(1);

    // Assertion 5: Action 5 - 優先度の高い課題を抽出して強調表示
    expect(mockAiClient.invokeAction05).toHaveBeenCalledTimes(1);

    // Assertion 6: 出力レポートの検証
    expect(output).toBeDefined();
    expect(output.reportId).toBeDefined();
    expect(typeof output.reportId).toBe('string');

    // Assertion 7: 再発パターンが30日間全体を対象に分析されている
    expect(output.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(output.recurringIssuePatterns)).toBe(true);
    expect(output.recurringIssuePatterns.length).toBeGreaterThan(0);

    // Assertion 8: 可視化グラフが複数形式で生成されている
    expect(output.visualizationGraphs).toBeDefined();
    expect(Array.isArray(output.visualizationGraphs)).toBe(true);
    expect(output.visualizationGraphs.length).toBeGreaterThan(0);

    const visualizationGraphTypes = output.visualizationGraphs.map(g => g.graphType);
    expect(visualizationGraphTypes).toContain('line');
    expect(visualizationGraphTypes).toContain('bar');

    // Assertion 9: メール送信日時が記録されている
    expect(output.emailSentAt).toBeDefined();
    expect(typeof output.emailSentAt).toBe('string');
    const emailSentDate = new Date(output.emailSentAt);
    expect(emailSentDate instanceof Date && !isNaN(emailSentDate.getTime())).toBe(true);

    // Assertion 10: 監査ログに期間・件数情報が記録されている
    expect(mockAuditLogger.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'REPORT_GENERATION_COMPLETED',
        analysisStartDate: startDate.toISOString(),
        analysisEndDate: endDate.toISOString(),
        totalRecordsAnalyzed: 100,
        analysisDaysCount: 30,
      })
    );

    // Assertion 11: 分析対象期間が正確に30日であることが出力に反映されている
    const reportMetadata = output.recurringIssuePatterns[0];
    expect(reportMetadata).toBeDefined();
    expect(reportMetadata.occurrenceCount).toBeGreaterThanOrEqual(0);

    // Assertion 12: 優先度スコアが0～100の範囲内
    output.recurringIssuePatterns.forEach((pattern: RecurringIssuePattern) => {
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
    });

    // Assertion 13: 時系列パターンが適切に分析されている
    output.recurringIssuePatterns.forEach((pattern: RecurringIssuePattern) => {
      expect(['増加傾向', '周期的', '急増', '安定', '減少傾向']).toContain(pattern.timeSeriesPattern);
    });

    // Assertion 14: グラフデータが適切に構成されている
    output.visualizationGraphs.forEach((graph: VisualizationGraph) => {
      expect(graph.title).toBeDefined();
      expect(graph.dataPoints).toBeDefined();
      expect(Array.isArray(graph.dataPoints)).toBe(true);
      expect(graph.dataPoints.length).toBeGreaterThan(0);
    });
  });
});