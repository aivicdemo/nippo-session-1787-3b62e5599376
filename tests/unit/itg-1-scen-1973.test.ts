import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  test('SCEN-1973: ボトルネック変化パターン可視化レポート生成 - 過去30日間の課題データ1件で、単一課題のレポートが生成される', async () => {
    // 分析対象期間の設定（過去30日間）
    const analysisEndDate = '2024-01-15T23:59:59Z';
    const analysisStartDate = '2023-12-17T00:00:00Z'; // 30日前

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager_001',
    };

    // TextAnalysisServiceAdapter のモック
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'APIレスポンス遅延',
            frequency: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'APIレスポンス遅延',
        impactScore: 45,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'APIレスポンス遅延',
        severity: '中',
      }),
    };

    // データベース内の過去30日間のデータ（単一課題1件）
    const mockReportData = {
      reports: [
        {
          reportId: 'report_20231220_001',
          reportDate: '2023-12-20T09:00:00Z',
          teamId: 'team_dev_001',
          issueKeyword: 'APIレスポンス遅延',
          issueDescription: 'APIレスポンスが遅延している',
          occurrenceCount: 1,
          firstOccurrenceDate: '2023-12-20T09:00:00Z',
          lastUpdatedDate: '2023-12-20T09:00:00Z',
        },
      ],
    };

    // AIエージェント実行
    const output: Tx8AgentOutput = await runTx8Imp1Agent(input, mockTextAnalysisServiceAdapter);

    // レポートIDの存在確認
    expect(output.reportId).toBeDefined();
    expect(typeof output.reportId).toBe('string');
    expect(output.reportId.length).toBeGreaterThan(0);

    // 再発課題パターンの検証
    expect(output.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(output.recurringIssuePatterns)).toBe(true);

    // 単一課題のため、recurringIssuePatterns は最小発生回数（3回）以下のため空になるか、
    // または最小発生回数を下回っているため除外される
    // ただし、このシナリオではminimumRecurrenceThreshold: 3 で occurrenceCount: 1 なので
    // 再発パターン判定ルールに合致しない可能性がある
    // 指示では「単一課題のため変化パターン（トレンド）グラフは表示されず」と記載されているため、
    // 可視化グラフは基本情報のみで複雑なトレンドグラフは含まれないことを期待する

    // 可視化グラフの検証
    expect(output.visualizationGraphs).toBeDefined();
    expect(Array.isArray(output.visualizationGraphs)).toBe(true);
    expect(output.visualizationGraphs.length).toBeGreaterThan(0);

    // グラフタイプの検証（単一課題のため複雑なグラフは期待されない）
    const graphTypes = output.visualizationGraphs.map((g) => g.graphType);
    expect(graphTypes).toEqual(
      expect.arrayContaining(['折れ線', '棒', '円', 'ヒートマップ'].slice(0, 2)) // 基本的なグラフのみ
    );

    // 各グラフのタイトル検証
    output.visualizationGraphs.forEach((graph: VisualizationGraph) => {
      expect(graph.title).toBeDefined();
      expect(typeof graph.title).toBe('string');
      expect(graph.title.length).toBeGreaterThan(0);

      // データポイントの検証
      expect(graph.dataPoints).toBeDefined();
      expect(Array.isArray(graph.dataPoints)).toBe(true);
      expect(graph.dataPoints.length).toBeGreaterThan(0);

      // 各データポイントの構造検証
      graph.dataPoints.forEach((dataPoint: object) => {
        expect(dataPoint).toBeDefined();
        expect(typeof dataPoint).toBe('object');
      });
    });

    // メール送信日時の検証
    expect(output.emailSentAt).toBeDefined();
    expect(typeof output.emailSentAt).toBe('string');

    // ISO 8601形式の日時であることを確認
    const emailSentDate = new Date(output.emailSentAt);
    expect(emailSentDate instanceof Date).toBe(true);
    expect(isNaN(emailSentDate.getTime())).toBe(false);

    // TextAnalysisServiceAdapter の呼び出しの検証
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    // レポート対象期間が正しく処理されたことを検証
    // 手順と期待結果から、過去30日間の単一課題で、以下の情報が含まれることを確認
    const firstPattern: RecurringIssuePattern | undefined = output.recurringIssuePatterns[0];

    if (firstPattern) {
      // 単一課題の場合の基本情報
      expect(firstPattern.issueKeyword).toBeDefined();
      expect(typeof firstPattern.issueKeyword).toBe('string');
      expect(firstPattern.issueKeyword).toMatch(/レスポンス|遅延|API/i);

      // 発生回数が1件
      expect(firstPattern.occurrenceCount).toBe(1);

      // 時系列パターンが定義されている（単一件のため周期的なパターンは期待されない）
      expect(firstPattern.timeSeriesPattern).toBeDefined();
      expect(typeof firstPattern.timeSeriesPattern).toBe('string');

      // 優先度スコアが45
      expect(firstPattern.priorityScore).toBe(45);
    }
  });
});