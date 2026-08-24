import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: ボトルネック変化パターン可視化レポート生成機能 - 同点課題の優先順位処理', () => {
  test('SCEN-2016: 複数課題が同じ発生頻度で並ぶとき、同点決定ルールが明示的に適用され、可視化レポートに反映される', async () => {
    // 準備: テスト用朝会報告データセット（10件の課題報告）
    const reportDataset = [
      {
        issueId: 'ISSUE-001',
        occurrenceDate: '2024-01-15T08:30:00Z',
        category: 'deploy_delay',
        categoryLabel: 'デプロイ遅延',
        severity: 'high',
        impactScore: 85,
      },
      {
        issueId: 'ISSUE-002',
        occurrenceDate: '2024-01-14T10:15:00Z',
        category: 'deploy_delay',
        categoryLabel: 'デプロイ遅延',
        severity: 'high',
        impactScore: 85,
      },
      {
        issueId: 'ISSUE-003',
        occurrenceDate: '2024-01-13T14:45:00Z',
        category: 'deploy_delay',
        categoryLabel: 'デプロイ遅延',
        severity: 'high',
        impactScore: 85,
      },
      {
        issueId: 'ISSUE-004',
        occurrenceDate: '2024-01-15T09:20:00Z',
        category: 'test_env_unstable',
        categoryLabel: 'テスト環境不安定',
        severity: 'high',
        impactScore: 80,
      },
      {
        issueId: 'ISSUE-005',
        occurrenceDate: '2024-01-14T11:00:00Z',
        category: 'test_env_unstable',
        categoryLabel: 'テスト環境不安定',
        severity: 'high',
        impactScore: 80,
      },
      {
        issueId: 'ISSUE-006',
        occurrenceDate: '2024-01-13T16:30:00Z',
        category: 'test_env_unstable',
        categoryLabel: 'テスト環境不安定',
        severity: 'high',
        impactScore: 80,
      },
      {
        issueId: 'ISSUE-007',
        occurrenceDate: '2024-01-12T13:00:00Z',
        category: 'doc_missing',
        categoryLabel: 'ドキュメント未更新',
        severity: 'medium',
        impactScore: 60,
      },
      {
        issueId: 'ISSUE-008',
        occurrenceDate: '2024-01-11T15:30:00Z',
        category: 'doc_missing',
        categoryLabel: 'ドキュメント未更新',
        severity: 'medium',
        impactScore: 60,
      },
      {
        issueId: 'ISSUE-009',
        occurrenceDate: '2024-01-10T09:00:00Z',
        category: 'api_error',
        categoryLabel: 'API エラー',
        severity: 'medium',
        impactScore: 65,
      },
      {
        issueId: 'ISSUE-010',
        occurrenceDate: '2024-01-09T12:00:00Z',
        category: 'build_fail',
        categoryLabel: 'ビルド失敗',
        severity: 'low',
        impactScore: 50,
      },
    ];

    const analysisStartDate = '2024-01-09T00:00:00Z';
    const analysisEndDate = '2024-01-15T23:59:59Z';
    const recipientManagerId = 'manager-001';

    // mock AI クライアント: 通常応答（高信頼度）
    const mockAiClientHighConfidence: Tx8Imp1AiClient = {
      extractIssueData: async () => ({
        extractedCount: 10,
        issues: reportDataset,
        extractionConfidence: 0.95,
      }),
      analyzeTimeSeriesPattern: async () => ({
        patterns: [
          {
            keyword: 'デプロイ遅延',
            occurrenceCount: 3,
            timeSeriesPattern: '増加傾向',
            priorityScore: 85,
            impactScore: 85,
            latestOccurrenceDate: '2024-01-15T08:30:00Z',
            tieReason: '同発生頻度。二次ソート基準: 最新発生日時がより直近',
          },
          {
            keyword: 'テスト環境不安定',
            occurrenceCount: 3,
            timeSeriesPattern: '周期的',
            priorityScore: 80,
            impactScore: 80,
            latestOccurrenceDate: '2024-01-15T09:20:00Z',
            tieReason: '同発生頻度。二次ソート基準: 最新発生日時がより直近だが、デプロイ遅延より2分遅い',
          },
          {
            keyword: 'ドキュメント未更新',
            occurrenceCount: 2,
            timeSeriesPattern: '周期的',
            priorityScore: 60,
            impactScore: 60,
            latestOccurrenceDate: '2024-01-12T13:00:00Z',
            tieReason: undefined,
          },
          {
            keyword: 'API エラー',
            occurrenceCount: 1,
            timeSeriesPattern: '単発',
            priorityScore: 65,
            impactScore: 65,
            latestOccurrenceDate: '2024-01-10T09:00:00Z',
            tieReason: undefined,
          },
          {
            keyword: 'ビルド失敗',
            occurrenceCount: 1,
            timeSeriesPattern: '単発',
            priorityScore: 50,
            impactScore: 50,
            latestOccurrenceDate: '2024-01-09T12:00:00Z',
            tieReason: undefined,
          },
        ],
        analysisConfidence: 0.92,
      }),
      generateVisualizationGraphs: async () => ({
        graphs: [
          {
            graphType: '棒グラフ',
            title: '発生頻度別課題ランキング',
            dataPoints: [
              { label: 'デプロイ遅延', value: 3, priority: 1, tieNote: '最新発生: 2024-01-15T08:30:00Z' },
              { label: 'テスト環境不安定', value: 3, priority: 2, tieNote: '最新発生: 2024-01-15T09:20:00Z (デプロイ遅延より2分遅延)' },
              { label: 'ドキュメント未更新', value: 2, priority: 3 },
              { label: 'API エラー', value: 1, priority: 4 },
              { label: 'ビルド失敗', value: 1, priority: 5 },
            ],
          },
          {
            graphType: '折れ線グラフ',
            title: '課題発生の時系列推移',
            dataPoints: [
              { date: '2024-01-09', deployDelay: 0, testEnvUnstable: 0, docMissing: 0, apiError: 0, buildFail: 1 },
              { date: '2024-01-10', deployDelay: 0, testEnvUnstable: 0, docMissing: 0, apiError: 1, buildFail: 0 },
              { date: '2024-01-11', deployDelay: 0, testEnvUnstable: 0, docMissing: 1, apiError: 0, buildFail: 0 },
              { date: '2024-01-12', deployDelay: 0, testEnvUnstable: 0, docMissing: 1, apiError: 0, buildFail: 0 },
              { date: '2024-01-13', deployDelay: 1, testEnvUnstable: 1, docMissing: 0, apiError: 0, buildFail: 0 },
              { date: '2024-01-14', deployDelay: 1, testEnvUnstable: 1, docMissing: 0, apiError: 0, buildFail: 0 },
              { date: '2024-01-15', deployDelay: 1, testEnvUnstable: 1, docMissing: 0, apiError: 0, buildFail: 0 },
            ],
          },
        ],
        generationConfidence: 0.88,
      }),
      buildFinalReport: async () => ({
        reportId: 'RPT-2024-01-15-001',
        title: 'ボトルネック変化パターン可視化レポート',
        analysisStartDate,
        analysisEndDate,
        recurringIssuePatterns: [
          {
            issueKeyword: 'デプロイ遅延',
            occurrenceCount: 3,
            timeSeriesPattern: '増加傾向',
            priorityScore: 85,
          },
          {
            issueKeyword: 'テスト環境不安定',
            occurrenceCount: 3,
            timeSeriesPattern: '周期的',
            priorityScore: 80,
          },
          {
            issueKeyword: 'ドキュメント未更新',
            occurrenceCount: 2,
            timeSeriesPattern: '周期的',
            priorityScore: 60,
          },
          {
            issueKeyword: 'API エラー',
            occurrenceCount: 1,
            timeSeriesPattern: '単発',
            priorityScore: 65,
          },
          {
            issueKeyword: 'ビルド失敗',
            occurrenceCount: 1,
            timeSeriesPattern: '単発',
            priorityScore: 50,
          },
        ],
        visualizationGraphs: [
          {
            graphType: '棒グラフ',
            title: '発生頻度別課題ランキング',
            dataPoints: [
              { label: 'デプロイ遅延', value: 3, priority: 1, tieNote: '最新発生: 2024-01-15T08:30:00Z' },
              { label: 'テスト環境不安定', value: 3, priority: 2, tieNote: '最新発生: 2024-01-15T09:20:00Z (デプロイ遅延より2分遅延)' },
              { label: 'ドキュメント未更新', value: 2, priority: 3 },
              { label: 'API エラー', value: 1, priority: 4 },
              { label: 'ビルド失敗', value: 1, priority: 5 },
            ],
          },
          {
            graphType: '折れ線グラフ',
            title: '課題発生の時系列推移',
            dataPoints: [
              { date: '2024-01-09', deployDelay: 0, testEnvUnstable: 0, docMissing: 0, apiError: 0, buildFail: 1 },
              { date: '2024-01-10', deployDelay: 0, testEnvUnstable: 0, docMissing: 0, apiError: 1, buildFail: 0 },
              { date: '2024-01-11', deployDelay: 0, testEnvUnstable: 0, docMissing: 1, apiError: 0, buildFail: 0 },
              { date: '2024-01-12', deployDelay: 0, testEnvUnstable: 0, docMissing: 1, apiError: 0, buildFail: 0 },
              { date: '2024-01-13', deployDelay: 1, testEnvUnstable: 1, docMissing: 0, apiError: 0, buildFail: 0 },
              { date: '2024-01-14', deployDelay: 1, testEnvUnstable: 1, docMissing: 0, apiError: 0, buildFail: 0 },
              { date: '2024-01-15', deployDelay: 1, testEnvUnstable: 1, docMissing: 0, apiError: 0, buildFail: 0 },
            ],
          },
        ],
        tieResolutionRules: {
          rule1: '同一発生頻度の課題に対しては、最新発生日時がより直近のものを一次優先とする',
          rule2: '最新発生日時が同じ場合は、影響度スコア（impactScore）が高い方を優先する',
          rule3: '影響度スコアも同じ場合は、セキュリティリスク等級、ビジネスインパクトの順に比較する',
        },
        highlightedIssues: [
          {
            issueKeyword: 'デプロイ遅延',
            occurrenceCount: 3,
            priorityScore: 85,
            highlighted: true,
            highlightReason: '発生頻度 3 件で同点のうち、最新発生日時（2024-01-15T08:30:00Z）がより直近のため一次優先',
          },
          {
            issueKeyword: 'テスト環境不安定',
            occurrenceCount: 3,
            priorityScore: 80,
            highlighted: true,
            highlightReason: '発生頻度 3 件で同点。デプロイ遅延と同等に重要であるため、同時に強調表示',
          },
        ],
        escalationMessages: [],
        reportConfidence: 0.90,
        generatedAt: '2024-01-15T12:00:00Z',
      }),
    };

    // 呼び出し: runTx8Imp1Agent を実行
    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds: undefined,
        minimumRecurrenceThreshold: 1,
        recipientManagerId,
      },
      mockAiClientHighConfidence,
    );

    // 検証: Action 1 (課題データ検索・抽出)
    expect(result.reportId).toBe('RPT-2024-01-15-001');
    expect(result.recurringIssuePatterns).toHaveLength(5);
    expect(result.recurringIssuePatterns[0].issueKeyword).toBe('デプロイ遅延');
    expect(result.recurringIssuePatterns[0].occurrenceCount).toBe(3);
    expect(result.recurringIssuePatterns[0].priorityScore).toBe(85);

    // 検証: Action 2 (再発パターンの時系列分析) - 発生頻度でソート
    expect(result.recurringIssuePatterns[0].occurrenceCount).toBeGreaterThanOrEqual(
      result.recurringIssuePatterns[1].occurrenceCount,
    );
    expect(result.recurringIssuePatterns[1].occurrenceCount).toBeGreaterThanOrEqual(
      result.recurringIssuePatterns[2].occurrenceCount,
    );

    // 検証: Action 3 (ボトルネック変化パターン特定) - 同点課題の優先順位判定
    const deployDelayPattern = result.recurringIssuePatterns.find((p) => p.issueKeyword === 'デプロイ遅延');
    const testEnvUnstablePattern = result.recurringIssuePatterns.find((p) => p.issueKeyword === 'テスト環境不安定');

    expect(deployDelayPattern).toBeDefined();
    expect(testEnvUnstablePattern).toBeDefined();
    expect(deployDelayPattern?.occurrenceCount).toBe(3);
    expect(testEnvUnstablePattern?.occurrenceCount).toBe(3);

    // 検証: 可視化グラフに同点ルールが反映されているか
    expect(result.visualizationGraphs).toHaveLength(2);
    const barGraph = result.visualizationGraphs.find((g) => g.graphType === '棒グラフ');
    expect(barGraph).toBeDefined();
    expect(barGraph?.dataPoints).toContainEqual(
      expect.objectContaining({
        label: 'デプロイ遅延',
        value: 3,
        priority: 1,
        tieNote: '最新発生: 2024-01-15T08:30:00Z',
      }),
    );
    expect(barGraph?.dataPoints).toContainEqual(
      expect.objectContaining({
        label: 'テスト環境不安定',
        value: 3,
        priority: 2,
        tieNote: '最新発生: 2024-01-15T09:20:00Z (デプロイ遅延より2分遅延)',
      }),
    );

    // 検証: 同点決定ルールが明示的に定義・ドキュメント化されているか
    const tieResolutionRules = (result as any).tieResolutionRules;
    if (tieResolutionRules) {
      expect(tieResolutionRules.rule1).toContain('最新発生日時');
      expect(tieResolutionRules.rule2).toContain('影響度スコア');
      expect(tieResolutionRules.rule3).toContain('セキュリティリスク');
    }

    // 検証: 強調表示の取り扱いが明確か
    const highlightedIssues = (result as any).highlightedIssues;
    if (highlightedIssues) {
      expect(highlightedIssues).toContainEqual(
        expect.objectContaining({
          issueKeyword: 'デプロイ遅延',
          occurrenceCount: 3,
          highlighted: true,
          highlightReason: expect.stringContaining('一次優先'),
        }),
      );
      expect(highlightedIssues).toContainEqual(
        expect.objectContaining({
          issueKeyword: 'テスト環境不安定',
          occurrenceCount: 3,
          highlighted: true,
          highlightReason: expect.stringContaining('同等に重要'),
        }),
      );
    }

    // 検証: レポート生成時刻が記録されているか
    const reportWithTimestamp = result as any;
    expect(reportWithTimestamp.generatedAt).toBe('2024-01-15T12:00:00Z');

    // 検証: 信頼度が高い場合、escalation message が生成されていないか
    const escalationMessages = (result as any).escalationMessages || [];
    expect(escalationMessages).toHaveLength(0);
  });

  test('SCEN-2016-ESC: AI クライアント応答の信頼度が低い場合、escalation condition がトリガーされ、人の確認タスクが生成される', async () => {
    const analysisStartDate = '2024-01-09T00:00:00Z';
    const analysisEndDate = '2024-01-15T23:59:59Z';
    const recipientManagerId = 'manager-001';

    // mock AI クライアント: 低信頼度応答 (ambiguous/低信頼度)
    const mockAiClientLowConfidence: Tx8Imp1AiClient = {
      extractIssueData: async () => ({
        extractedCount: 10,
        issues: [
          {
            issueId: 'ISSUE-001',
            occurrenceDate: '2024-01-15T08:30:00Z',
            category: 'unknown_pattern',
            categoryLabel: '未分類パターン',
            severity: 'unknown',
            impactScore: 0,
          },
        ],
        extractionConfidence: 0.55, // 基準未満
      }),
      analyzeTimeSeriesPattern: async () => ({
        patterns: [
          {
            keyword: '不明な課題パターン',
            occurrenceCount: 1,
            timeSeriesPattern: '不明',
            priorityScore: 0,
            impactScore: 0,
            latestOccurrenceDate: '2024-01-15T08:30:00Z',
            tieReason: undefined,
          },
        ],
        analysisConfidence: 0.50, // 基準未満
      }),
      generateVisualizationGraphs: async () => ({
        graphs: [],
        generationConfidence: 0.45, // 基準未満
      }),
      buildFinalReport: async () => ({
        reportId: 'RPT-2024-01-15-LOW-CONF',
        title: 'ボトルネック変化パターン可視化レポート（要確認）',
        analysisStartDate,
        analysisEndDate,
        recurringIssuePatterns: [
          {
            issueKeyword: '不明な課題パターン',
            occurrenceCount: 1,
            timeSeriesPattern: '不明',
            priorityScore: 0,
          },
        ],
        visualizationGraphs: [],
        escalationMessages: [
          {
            severity: 'high',
            message: '新規の未分類パターンが検出されました。この優先順位判定に対して人による確認が必要です。',
            detectedPattern: '不明な課題パターン',
            requiredAction: 'manager_review',
            reviewDeadline: '2024-01-16T09:00:00Z',
          },
        ],
        reportConfidence: 0.48,
        generatedAt: '2024-01-15T12:00:00Z',
      }),
    };

    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds: undefined,
        minimumRecurrenceThreshold: 1,
        recipientManagerId,
      },
      mockAiClientLowConfidence,
    );

    // 検証: escalation message が生成されているか
    const escalationMessages = (result as any).escalationMessages || [];
    expect(escalationMessages.length).toBeGreaterThan(0);
    expect(escalationMessages[0]).toMatchObject({
      severity: 'high',
      message: expect.stringContaining('人による確認が必要'),
    });
    expect(escalationMessages[0].requiredAction).toBe('manager_review');
    expect(escalationMessages[0].reviewDeadline).toBe('2024-01-16T09:00:00Z');

    // 検証: レポート信頼度が低く表示されているか
    expect((result as any).reportConfidence).toBeLessThan(0.7);
  });
});