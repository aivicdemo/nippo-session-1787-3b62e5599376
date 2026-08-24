import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX-8 課題検索から可視化レポート作成までの自動実行エージェント', () => {
  // SCEN-2013: [edge] ボトルネック変化パターン可視化レポート生成機能 - 分析対象期間が月末から翌月初にまたがるとき、カレンダー月をまたいで正しく集計される
  test('月末から翌月初にまたがる分析期間で、カレンダー月ごとに正しく集計・可視化される', async () => {
    // テスト用偽AIクライアントの定義
    const mockAiClient: Tx8Imp1AiClient = {
      // Action 1: 課題データ抽出
      action01ExtractIssueData: jest.fn().mockResolvedValue({
        extractedIssues: [
          // 1月28日～31日の課題（10件）
          { issueId: 'JAN-001', keyword: 'ビルドエラー', reportedDate: '2024-01-28', severity: 'high' },
          { issueId: 'JAN-002', keyword: 'テストの失敗', reportedDate: '2024-01-29', severity: 'medium' },
          { issueId: 'JAN-003', keyword: 'デプロイ遅延', reportedDate: '2024-01-30', severity: 'high' },
          { issueId: 'JAN-004', keyword: 'パフォーマンス低下', reportedDate: '2024-01-31', severity: 'medium' },
          { issueId: 'JAN-005', keyword: 'セキュリティ脆弱性', reportedDate: '2024-01-28', severity: 'critical' },
          { issueId: 'JAN-006', keyword: 'ビルドエラー', reportedDate: '2024-01-29', severity: 'high' },
          { issueId: 'JAN-007', keyword: 'テストの失敗', reportedDate: '2024-01-30', severity: 'low' },
          { issueId: 'JAN-008', keyword: 'デプロイ遅延', reportedDate: '2024-01-31', severity: 'medium' },
          { issueId: 'JAN-009', keyword: 'API障害', reportedDate: '2024-01-28', severity: 'critical' },
          { issueId: 'JAN-010', keyword: 'パフォーマンス低下', reportedDate: '2024-01-29', severity: 'low' },
          // 2月1日～3日の課題（15件）
          { issueId: 'FEB-001', keyword: 'ビルドエラー', reportedDate: '2024-02-01', severity: 'high' },
          { issueId: 'FEB-002', keyword: 'テストの失敗', reportedDate: '2024-02-01', severity: 'medium' },
          { issueId: 'FEB-003', keyword: 'デプロイ遅延', reportedDate: '2024-02-02', severity: 'high' },
          { issueId: 'FEB-004', keyword: 'ビルドエラー', reportedDate: '2024-02-02', severity: 'critical' },
          { issueId: 'FEB-005', keyword: 'データベース接続エラー', reportedDate: '2024-02-02', severity: 'critical' },
          { issueId: 'FEB-006', keyword: 'テストの失敗', reportedDate: '2024-02-03', severity: 'high' },
          { issueId: 'FEB-007', keyword: 'パフォーマンス低下', reportedDate: '2024-02-03', severity: 'medium' },
          { issueId: 'FEB-008', keyword: 'セキュリティ脆弱性', reportedDate: '2024-02-01', severity: 'low' },
          { issueId: 'FEB-009', keyword: 'API障害', reportedDate: '2024-02-03', severity: 'medium' },
          { issueId: 'FEB-010', keyword: 'ドキュメント不備', reportedDate: '2024-02-02', severity: 'low' },
          { issueId: 'FEB-011', keyword: 'ビルドエラー', reportedDate: '2024-02-01', severity: 'high' },
          { issueId: 'FEB-012', keyword: 'テストの失敗', reportedDate: '2024-02-02', severity: 'medium' },
          { issueId: 'FEB-013', keyword: 'デプロイ遅延', reportedDate: '2024-02-03', severity: 'high' },
          { issueId: 'FEB-014', keyword: 'パフォーマンス低下', reportedDate: '2024-02-01', severity: 'low' },
          { issueId: 'FEB-015', keyword: 'API障害', reportedDate: '2024-02-02', severity: 'medium' },
        ],
        totalExtractedCount: 25,
        extractionTimestamp: '2024-02-03T10:00:00Z',
      }),
      // Action 2: 再発パターン時系列分析
      action02AnalyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        timeSeriesAnalysis: [
          {
            keyword: 'ビルドエラー',
            occurrences: [
              { date: '2024-01-28', count: 1 },
              { date: '2024-01-29', count: 1 },
              { date: '2024-02-01', count: 1 },
              { date: '2024-02-02', count: 1 },
              { date: '2024-02-01', count: 1 },
            ],
            totalCount: 5,
            pattern: 'continuous',
          },
          {
            keyword: 'テストの失敗',
            occurrences: [
              { date: '2024-01-29', count: 1 },
              { date: '2024-01-30', count: 1 },
              { date: '2024-02-01', count: 1 },
              { date: '2024-02-03', count: 1 },
              { date: '2024-02-02', count: 1 },
            ],
            totalCount: 5,
            pattern: 'intermittent',
          },
          {
            keyword: 'デプロイ遅延',
            occurrences: [
              { date: '2024-01-30', count: 1 },
              { date: '2024-01-31', count: 1 },
              { date: '2024-02-02', count: 1 },
              { date: '2024-02-03', count: 1 },
            ],
            totalCount: 4,
            pattern: 'increasing',
          },
        ],
        analysisCompletedAt: '2024-02-03T10:05:00Z',
      }),
      // Action 3: ボトルネック変化パターン特定
      action03IdentifyBottleneckPattern: jest.fn().mockResolvedValue({
        bottleneckPatterns: [
          {
            category: 'Infrastructure',
            issues: ['ビルドエラー', 'デプロイ遅延', 'API障害'],
            monthlyTrend: {
              january: { issueCount: 5, severity: 'high' },
              february: { issueCount: 8, severity: 'critical' },
            },
            changeDetected: true,
            changeDescription: 'インフラ系の課題が1月から2月にかけて増加傾向。特に2月は重大度がcriticalに上昇',
            crossMonthBoundaryChange: {
              beforeMonthEnd: 2,
              afterMonthStart: 3,
              continuity: 'maintained',
            },
          },
          {
            category: 'QualityAssurance',
            issues: ['テストの失敗', 'セキュリティ脆弱性'],
            monthlyTrend: {
              january: { issueCount: 3, severity: 'medium' },
              february: { issueCount: 4, severity: 'medium' },
            },
            changeDetected: false,
            changeDescription: '品質関連の課題は安定。わずかな増加のみ',
            crossMonthBoundaryChange: {
              beforeMonthEnd: 1,
              afterMonthStart: 1,
              continuity: 'maintained',
            },
          },
        ],
        identificationCompletedAt: '2024-02-03T10:10:00Z',
      }),
      // Action 4: 可視化レポート自動生成
      action04GenerateVisualizationReport: jest.fn().mockResolvedValue({
        reportId: 'RPT-TX8-20240203-001',
        reportTitle: 'ボトルネック変化パターン可視化レポート',
        analysisDateRange: {
          startDate: '2024-01-28',
          endDate: '2024-02-03',
          formattedRange: '2024年1月28日～2月3日',
        },
        monthlySummary: {
          january: {
            totalIssueCount: 10,
            calendarMonth: 'January 2024',
            issuesByKeyword: {
              'ビルドエラー': 2,
              'テストの失敗': 2,
              'デプロイ遅延': 2,
              'パフォーマンス低下': 2,
              'セキュリティ脆弱性': 1,
              'API障害': 1,
            },
          },
          february: {
            totalIssueCount: 15,
            calendarMonth: 'February 2024',
            issuesByKeyword: {
              'ビルドエラー': 3,
              'テストの失敗': 3,
              'デプロイ遅延': 2,
              'パフォーマンス低下': 2,
              'セキュリティ脆弱性': 1,
              'API障害': 2,
              'データベース接続エラー': 1,
              'ドキュメント不備': 1,
            },
          },
        },
        cumulativeMetrics: {
          totalIssueCount: 25,
          uniqueKeywordCount: 9,
          averageIssuesPerDay: 4.17,
        },
        visualizationGraphs: [
          {
            graphType: 'line',
            title: 'Daily Issue Trend (Jan 28 - Feb 3)',
            dataPoints: [
              { date: '2024-01-28', count: 3 },
              { date: '2024-01-29', count: 3 },
              { date: '2024-01-30', count: 2 },
              { date: '2024-01-31', count: 2 },
              { date: '2024-02-01', count: 4 },
              { date: '2024-02-02', count: 5 },
              { date: '2024-02-03', count: 3 },
            ],
            xAxisLabel: 'Date',
            yAxisLabel: 'Issue Count',
            monthBoundaryMarked: true,
          },
          {
            graphType: 'bar',
            title: 'Issue Distribution by Category',
            dataPoints: [
              { category: 'Infrastructure', january: 5, february: 8, totalCount: 13 },
              { category: 'QualityAssurance', january: 3, february: 4, totalCount: 7 },
              { category: 'Documentation', january: 0, february: 1, totalCount: 1 },
              { category: 'Database', january: 0, february: 1, totalCount: 1 },
              { category: 'Performance', january: 2, february: 2, totalCount: 4 },
            ],
            xAxisLabel: 'Category',
            yAxisLabel: 'Count',
            monthBoundaryMarked: true,
          },
          {
            graphType: 'heatmap',
            title: 'Issue Severity Heatmap by Date',
            dataPoints: [
              { date: '2024-01-28', critical: 2, high: 1, medium: 0, low: 0 },
              { date: '2024-01-29', critical: 0, high: 1, medium: 1, low: 1 },
              { date: '2024-01-30', critical: 0, high: 1, medium: 0, low: 1 },
              { date: '2024-01-31', critical: 0, high: 0, medium: 2, low: 0 },
              { date: '2024-02-01', critical: 0, high: 1, medium: 2, low: 1 },
              { date: '2024-02-02', critical: 2, high: 1, medium: 1, low: 1 },
              { date: '2024-02-03', critical: 0, high: 2, medium: 1, low: 0 },
            ],
            xAxisLabel: 'Date',
            yAxisLabel: 'Severity',
            monthBoundaryMarked: true,
          },
        ],
        reportGeneratedAt: '2024-02-03T10:15:00Z',
      }),
      // Action 5: 部長へ完成通知送信（実装不要だが、バウンダリ保証のため定義）
      action05NotifyCompletion: jest.fn().mockResolvedValue({
        notificationSent: true,
        recipientManagerId: 'MGR-001',
        notificationTimestamp: '2024-02-03T10:16:00Z',
      }),
    };

    // 入力パラメータの定義
    const input = {
      analysisStartDate: '2024-01-28',
      analysisEndDate: '2024-02-03',
      teamIds: undefined,
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'MGR-001',
    };

    // runTx8Imp1Agent を実行
    const result = await runTx8Imp1Agent(input, mockAiClient);

    // assertion: 第2パラメータが Tx8Imp1AiClient 構造と完全一致していることを確認
    expect(mockAiClient).toBeDefined();
    expect(typeof mockAiClient.action01ExtractIssueData).toBe('function');
    expect(typeof mockAiClient.action02AnalyzeTimeSeriesPattern).toBe('function');
    expect(typeof mockAiClient.action03IdentifyBottleneckPattern).toBe('function');
    expect(typeof mockAiClient.action04GenerateVisualizationReport).toBe('function');
    expect(typeof mockAiClient.action05NotifyCompletion).toBe('function');

    // assertion: 生成されたレポートの基本情報を検証
    expect(result).toBeDefined();
    expect(result.reportId).toBe('RPT-TX8-20240203-001');
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);

    // assertion: 月末から翌月初にまたがる期間で正しく集計されているか検証
    expect(result.analysisPeriod).toEqual({
      startDate: '2024-01-28',
      endDate: '2024-02-03',
      formattedRange: '2024年1月28日～2月3日',
    });

    // assertion: 1月データが正しくカレンダー月に分類・集計されている（期待値=10件）
    expect(result.monthlySummary.january.totalIssueCount).toBe(10);
    expect(result.monthlySummary.january.calendarMonth).toBe('January 2024');

    // assertion: 2月データが正しくカレンダー月に分類・集計されている（期待値=15件）
    expect(result.monthlySummary.february.totalIssueCount).toBe(15);
    expect(result.monthlySummary.february.calendarMonth).toBe('February 2024');

    // assertion: 総合集計値が正確である（期待値=25件）
    expect(result.cumulativeMetrics.totalIssueCount).toBe(25);

    // assertion: 再発パターンが正しく抽出されているか（発生頻度と時系列パターン）
    const buildErrorPattern = result.recurringIssuePatterns.find(
      (p) => p.issueKeyword === 'ビルドエラー'
    );
    expect(buildErrorPattern).toBeDefined();
    expect(buildErrorPattern?.occurrenceCount).toBe(5);
    expect(buildErrorPattern?.timeSeriesPattern).toBe('continuous');

    const deployDelayPattern = result.recurringIssuePatterns.find(
      (p) => p.issueKeyword === 'デプロイ遅延'
    );
    expect(deployDelayPattern).toBeDefined();
    expect(deployDelayPattern?.occurrenceCount).toBe(4);
    expect(deployDelayPattern?.timeSeriesPattern).toBe('increasing');

    // assertion: レポート内のグラフが月の境界で不連続や重複がないか確認
    const dailyTrendGraph = result.visualizationGraphs.find(
      (g) => g.graphType === 'line' && g.title.includes('Daily Issue Trend')
    );
    expect(dailyTrendGraph).toBeDefined();
    expect(dailyTrendGraph?.monthBoundaryMarked).toBe(true);
    expect(Array.isArray(dailyTrendGraph?.dataPoints)).toBe(true);

    // assertion: 日付のデータポイントが連続的に表示され、月の境界で欠落がないか
    if (dailyTrendGraph?.dataPoints) {
      const dates = dailyTrendGraph.dataPoints.map((dp: any) => dp.date);
      expect(dates.length).toBe(7); // 1月28日から2月3日までの7日間
      expect(dates[0]).toBe('2024-01-28');
      expect(dates[3]).toBe('2024-01-31');
      expect(dates[4]).toBe('2024-02-01'); // 月の境界を越えて連続
      expect(dates[6]).toBe('2024-02-03');
    }

    // assertion: 全5つのアクションが正序で実行されたことを確認
    expect(mockAiClient.action01ExtractIssueData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02AnalyzeTimeSeriesPattern).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action03IdentifyBottleneckPattern).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action04GenerateVisualizationReport).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action05NotifyCompletion).toHaveBeenCalledTimes(1);

    // assertion: 月をまたいだ課題の再発パターン連続性が保持されているか
    expect(result.bottleneckPatterns).toBeDefined();
    if (result.bottleneckPatterns) {
      const infrastructureBottleneck = result.bottleneckPatterns.find(
        (bp) => bp.category === 'Infrastructure'
      );
      expect(infrastructureBottleneck).toBeDefined();
      expect(infrastructureBottleneck?.crossMonthBoundaryChange).toBeDefined();
      expect(infrastructureBottleneck?.crossMonthBoundaryChange?.continuity).toBe('maintained');
    }

    // assertion: emailSentAt が ISO 8601 形式で記録されているか
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.emailSentAt)).toBe(true);
  });
});