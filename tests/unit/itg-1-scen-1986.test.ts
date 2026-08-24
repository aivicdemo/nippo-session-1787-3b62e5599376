import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput, RecurringIssuePattern, VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/types';

describe('TX-8 Imp-1: ボトルネック変化パターン可視化レポート生成', () => {
  // SCEN-1986
  test('部長向けダッシュボード表示に最適化されたボトルネック可視化レポートを生成する', async () => {
    // Arrange: テスト用のモック AI クライアント
    const mockAiClient: Tx8Imp1AiClient = {
      extractKeywordsFromReports: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 7, confidenceScore: 0.92 },
          { keyword: 'API レスポンス遅延', frequency: 5, confidenceScore: 0.88 },
          { keyword: 'メモリリーク', frequency: 4, confidenceScore: 0.85 },
          { keyword: 'ネットワーク断絶', frequency: 3, confidenceScore: 0.80 },
        ],
      }),
      assessImpactScores: jest.fn().mockResolvedValue({
        scores: [
          { keyword: 'データベース接続エラー', impactScore: 92, severity: '高' },
          { keyword: 'API レスポンス遅延', impactScore: 78, severity: '中' },
          { keyword: 'メモリリーク', impactScore: 65, severity: '中' },
          { keyword: 'ネットワーク断絶', impactScore: 88, severity: '高' },
        ],
      }),
      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        patterns: [
          {
            keyword: 'データベース接続エラー',
            timeSeriesData: [
              { date: '2024-01-15', count: 1 },
              { date: '2024-01-16', count: 2 },
              { date: '2024-01-17', count: 1 },
              { date: '2024-01-18', count: 1 },
              { date: '2024-01-19', count: 2 },
              { date: '2024-01-20', count: 0 },
              { date: '2024-01-21', count: 0 },
            ],
            pattern: '周期的',
          },
          {
            keyword: 'API レスポンス遅延',
            timeSeriesData: [
              { date: '2024-01-15', count: 1 },
              { date: '2024-01-16', count: 0 },
              { date: '2024-01-17', count: 1 },
              { date: '2024-01-18', count: 1 },
              { date: '2024-01-19', count: 2 },
              { date: '2024-01-20', count: 0 },
              { date: '2024-01-21', count: 0 },
            ],
            pattern: '増加傾向',
          },
        ],
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: '棒グラフ',
            title: 'ボトルネック課題の発生頻度推移',
            dataPoints: [
              { date: '2024-01-15', value: 2 },
              { date: '2024-01-16', value: 2 },
              { date: '2024-01-17', value: 2 },
              { date: '2024-01-18', value: 2 },
              { date: '2024-01-19', value: 4 },
              { date: '2024-01-20', count: 0 },
              { date: '2024-01-21', count: 0 },
            ],
          },
          {
            graphType: '円グラフ',
            title: '課題の発生比率',
            dataPoints: [
              { label: 'データベース接続エラー', percentage: 43.75 },
              { label: 'ネットワーク断絶', percentage: 18.75 },
              { label: 'API レスポンス遅延', percentage: 31.25 },
              { label: 'メモリリーク', percentage: 6.25 },
            ],
          },
        ],
      }),
    };

    // Act: レポート生成エージェントを実行
    const input: Tx8AgentInput = {
      analysisStartDate: '2024-01-15',
      analysisEndDate: '2024-01-21',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const output: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    // Assert: レポート出力が部長向けダッシュボード表示に最適化された形式であることを確認
    expect(output).toBeDefined();
    expect(output.reportId).toMatch(/^report-/);

    // 1. 再発課題パターン検証（3～5件のボトルネック課題）
    expect(output.recurringIssuePatterns).toBeDefined();
    expect(output.recurringIssuePatterns.length).toBeGreaterThanOrEqual(3);
    expect(output.recurringIssuePatterns.length).toBeLessThanOrEqual(5);

    // 各課題の構造と値を検証
    output.recurringIssuePatterns.forEach((pattern: RecurringIssuePattern) => {
      expect(pattern.issueKeyword).toBeTruthy();
      expect(pattern.issueKeyword).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/); // 日本語を含む
      expect(typeof pattern.occurrenceCount).toBe('number');
      expect(pattern.occurrenceCount).toBeGreaterThanOrEqual(0);
      expect(pattern.timeSeriesPattern).toMatch(/^(増加傾向|周期的|急増|安定)$/);
      expect(typeof pattern.priorityScore).toBe('number');
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
    });

    // 最高優先度の課題を検証（実際にダッシュボード表示される）
    const topIssue = output.recurringIssuePatterns[0];
    expect(topIssue.issueKeyword).toBe('データベース接続エラー');
    expect(topIssue.occurrenceCount).toBe(7);
    expect(topIssue.priorityScore).toBe(92);

    // 2. グラフ形式による可視化データ検証
    expect(output.visualizationGraphs).toBeDefined();
    expect(output.visualizationGraphs.length).toBeGreaterThanOrEqual(2);

    // 棒グラフの検証
    const barGraph = output.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === '棒グラフ'
    );
    expect(barGraph).toBeDefined();
    expect(barGraph?.title).toBe('ボトルネック課題の発生頻度推移');
    expect(Array.isArray(barGraph?.dataPoints)).toBe(true);
    expect(barGraph?.dataPoints.length).toBe(7); // 7日間のデータ

    // 円グラフの検証
    const pieGraph = output.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === '円グラフ'
    );
    expect(pieGraph).toBeDefined();
    expect(pieGraph?.title).toBe('課題の発生比率');

    // 3. 数値フォーマット検証
    output.recurringIssuePatterns.forEach((pattern: RecurringIssuePattern) => {
      // 優先度スコアは小数第1位までの数値
      const scoreStr = pattern.priorityScore.toString();
      if (scoreStr.includes('.')) {
        const decimalPlaces = scoreStr.split('.')[1].length;
        expect(decimalPlaces).toBeLessThanOrEqual(1);
      }
    });

    // 出現頻度は整数値
    output.recurringIssuePatterns.forEach((pattern: RecurringIssuePattern) => {
      expect(pattern.occurrenceCount).toBe(Math.floor(pattern.occurrenceCount));
    });

    // 4. タイムゾーン検証（ISO 8601 形式、JST）
    expect(output.emailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/);
    // 送信時刻は現在時刻の付近（前後5分以内）
    const sentTime = new Date(output.emailSentAt);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - sentTime.getTime());
    expect(diffMs).toBeLessThan(5 * 60 * 1000); // 5分以内

    // 5. ダッシュボード表示要件の検証
    // 日本語対応（課題キーワードに日本語が含まれる）
    const hasJapanese = output.recurringIssuePatterns.some((p: RecurringIssuePattern) =>
      /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(p.issueKeyword)
    );
    expect(hasJapanese).toBe(true);

    // 全体データ要件検証
    const reportJson = JSON.stringify(output);
    expect(reportJson.length).toBeLessThan(2 * 1024 * 1024); // 2MB以下

    // 6. 集計期間の検証
    const expectedDayCount = 7;
    const barGraphDataPoints = barGraph?.dataPoints || [];
    expect(barGraphDataPoints.length).toBe(expectedDayCount);

    // 7. 各課題の波及度スコアと重要度レベルの確認
    const dbErrorPattern = output.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'データベース接続エラー'
    );
    expect(dbErrorPattern).toBeDefined();
    expect(dbErrorPattern!.priorityScore).toBe(92);
    // 優先度スコア92は「高」相当のスコア範囲に該当
    expect(dbErrorPattern!.priorityScore).toBeGreaterThanOrEqual(80);

    // 8. キーワード辞書テーブルとの一致確認
    const extractedKeywords = ['データベース接続エラー', 'API レスポンス遅延', 'メモリリーク', 'ネットワーク断絶'];
    output.recurringIssuePatterns.forEach((pattern: RecurringIssuePattern) => {
      expect(extractedKeywords).toContain(pattern.issueKeyword);
    });

    // 9. 最頻出課題の検証（出現頻度7回）
    expect(topIssue.occurrenceCount).toBe(7);
    expect(topIssue.timeSeriesPattern).toBe('周期的');

    // 10. AI クライアントメソッドが適切に呼び出されたことを検証
    expect(mockAiClient.extractKeywordsFromReports).toHaveBeenCalled();
    expect(mockAiClient.assessImpactScores).toHaveBeenCalled();
    expect(mockAiClient.analyzeTimeSeriesPattern).toHaveBeenCalled();
    expect(mockAiClient.generateVisualizationGraphs).toHaveBeenCalled();
  });
});