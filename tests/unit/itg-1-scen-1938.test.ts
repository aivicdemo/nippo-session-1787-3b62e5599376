import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('朝会報告管理システム - 課題の再発パターン分析機能', () => {
  test('SCEN-1938: 数千件の課題データセット（3000件）を処理する際、グループ化と時系列パターンの可視化が完遂される', async () => {
    // テストデータベースに3,000件の課題データ（過去12ヶ月分、複数チームメンバーの日報から抽出）を投入
    const mockIssueData: Array<{
      issueKeyword: string;
      occurrenceDate: string;
      teamId: string;
      impactScore: number;
    }> = [];

    // 12ヶ月分のデータを生成（毎月約250件、複数キーワード）
    const keywords = [
      'ビルドエラー',
      'テスト失敗',
      'メモリリーク',
      'ネットワーク遅延',
      'デプロイ失敗',
      'データベース接続',
      'API応答遅延',
      'ログファイル肥大化',
      'キャッシュ不整合',
      '権限エラー',
      'セッションタイムアウト',
      'リソース枯渇',
      'バージョン競合',
      'タイムゾーン問題',
      '文字コード判定',
    ];

    const teamIds = ['team-001', 'team-002', 'team-003', 'team-004', 'team-005'];

    for (let month = 0; month < 12; month++) {
      for (let i = 0; i < 250; i++) {
        const dayOfMonth = (i % 28) + 1;
        const occurrenceDate = new Date(2023, month, dayOfMonth);

        mockIssueData.push({
          issueKeyword: keywords[i % keywords.length],
          occurrenceDate: occurrenceDate.toISOString().split('T')[0],
          teamId: teamIds[i % teamIds.length],
          impactScore: Math.floor(Math.random() * 100) + 1,
        });
      }
    }

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        const extractedKeywords: Array<{ keyword: string; frequency: number }> =
          [];
        for (const keyword of keywords) {
          if (text.toLowerCase().includes(keyword)) {
            extractedKeywords.push({
              keyword,
              frequency: Math.floor(Math.random() * 5) + 1,
            });
          }
        }
        return extractedKeywords;
      }),

      assessImpactScore: jest.fn(async (keyword: string) => {
        return Math.floor(Math.random() * 100) + 1;
      }),

      classifyIssueSeverity: jest.fn(async (issueText: string) => {
        const severityOptions = ['high', 'medium', 'low'];
        return severityOptions[Math.floor(Math.random() * 3)];
      }),
    };

    // 入力パラメータ
    const agentInput = {
      analysisStartDate: '2023-01-01',
      analysisEndDate: '2023-12-31',
      teamIds: teamIds,
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    // 処理時間を計測
    const startTime = Date.now();

    // 課題の再発パターン分析機能を呼び出し
    const agentOutput = await runTx8Imp1Agent(agentInput, mockTextAnalysisServiceAdapter);

    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    // 処理時間が60秒以内に完遂されていることを確認
    expect(processingTimeMs).toBeLessThan(60000);

    // グループ化結果としてreportIdが返却されていることを確認
    expect(agentOutput.reportId).toBeDefined();
    expect(typeof agentOutput.reportId).toBe('string');
    expect(agentOutput.reportId.length).toBeGreaterThan(0);

    // 再発課題パターンが返却されていることを確認
    expect(agentOutput.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(agentOutput.recurringIssuePatterns)).toBe(true);

    // グループ化結果として最低10以上の課題カテゴリに分類されていることを確認
    const uniqueKeywords = new Set(
      agentOutput.recurringIssuePatterns.map((p) => p.issueKeyword)
    );
    expect(uniqueKeywords.size).toBeGreaterThanOrEqual(10);

    // 各カテゴリの出現頻度と件数が正確に集計されていることを確認
    for (const pattern of agentOutput.recurringIssuePatterns) {
      expect(pattern.issueKeyword).toBeDefined();
      expect(typeof pattern.issueKeyword).toBe('string');
      expect(pattern.issueKeyword.length).toBeGreaterThan(0);

      expect(pattern.occurrenceCount).toBeDefined();
      expect(typeof pattern.occurrenceCount).toBe('number');
      expect(pattern.occurrenceCount).toBeGreaterThanOrEqual(minimumRecurrenceThreshold);

      expect(pattern.timeSeriesPattern).toBeDefined();
      expect(typeof pattern.timeSeriesPattern).toBe('string');
      expect(['増加傾向', '周期的', '急増', '減少傾向', '一定'].some(p => pattern.timeSeriesPattern.includes(p))).toBe(true);

      expect(pattern.priorityScore).toBeDefined();
      expect(typeof pattern.priorityScore).toBe('number');
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
    }

    // 時系列パターンの可視化データが生成されていることを確認
    expect(agentOutput.visualizationGraphs).toBeDefined();
    expect(Array.isArray(agentOutput.visualizationGraphs)).toBe(true);
    expect(agentOutput.visualizationGraphs.length).toBeGreaterThan(0);

    // 可視化データの構造を検証
    const graphTypes = new Set<string>();
    for (const graph of agentOutput.visualizationGraphs) {
      expect(graph.graphType).toBeDefined();
      expect(typeof graph.graphType).toBe('string');
      expect(['折れ線', '棒', '円', 'ヒートマップ'].some(t => graph.graphType.includes(t))).toBe(true);
      graphTypes.add(graph.graphType);

      expect(graph.title).toBeDefined();
      expect(typeof graph.title).toBe('string');
      expect(graph.title.length).toBeGreaterThan(0);

      expect(graph.dataPoints).toBeDefined();
      expect(Array.isArray(graph.dataPoints)).toBe(true);
      expect(graph.dataPoints.length).toBeGreaterThan(0);

      // 月別・週別トレンドのデータポイントを確認
      for (const dataPoint of graph.dataPoints) {
        expect(dataPoint).toBeDefined();
        expect(typeof dataPoint).toBe('object');
      }
    }

    // 12ヶ月間の月別トレンド、4週間単位の週別トレンド、再発周期が検出されていることを確認
    expect(graphTypes.size).toBeGreaterThanOrEqual(3);

    // データ完全性を検証：入力3,000件に対して分類・集計対象が3,000件で一致
    const totalOccurrenceCount = agentOutput.recurringIssuePatterns.reduce(
      (sum, pattern) => sum + pattern.occurrenceCount,
      0
    );
    expect(totalOccurrenceCount).toBe(3000);

    // メール送信日時が記録されていることを確認
    expect(agentOutput.emailSentAt).toBeDefined();
    expect(typeof agentOutput.emailSentAt).toBe('string');

    // ISO 8601形式であることを確認
    const emailSentAtDate = new Date(agentOutput.emailSentAt);
    expect(emailSentAtDate.getTime()).toBeGreaterThan(0);

    // 処理時間が60秒以内に完遂されていることを再度確認
    expect(processingTimeMs).toBeLessThan(60000);

    // 最低10以上の課題カテゴリ分類を再度確認
    expect(uniqueKeywords.size).toBeGreaterThanOrEqual(10);
  });

  // Helper constants for test
  const minimumRecurrenceThreshold = 3;
});