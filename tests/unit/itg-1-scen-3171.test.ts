import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行 - 分析結果矛盾・異常値検出時のエスカレーション', () => {
  test('SCEN-3171: 分析結果に矛盾や異常値が含まれる場合、人へ引き継いで副作用を確定前に停止する', async () => {
    // テスト初期化: フェイク AI クライアント（Tx6Imp1AiClient）を準備
    const mockAiClient: Tx6Imp1AiClient = {
      // Action 1: 前週の日報データを自動収集
      collectWeeklyReports: jest.fn().mockResolvedValue({
        reportIds: ['rep-001', 'rep-002', 'rep-003'],
        totalCount: 3,
        collectionTimestamp: new Date('2024-01-22T09:00:00Z'),
      }),

      // Action 2: 未提出メンバーを特定し、リマインド通知を送信
      identifyNonSubmitters: jest.fn().mockResolvedValue({
        nonSubmitterIds: ['user-005'],
        remindersSent: 1,
        sentAt: new Date('2024-01-22T09:05:00Z'),
      }),

      // Action 3: 課題を抽出・分類
      extractAndClassifyIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          { issueId: 'iss-001', keyword: 'database_performance', category: 'infrastructure', frequency: 3 },
          { issueId: 'iss-002', keyword: 'database_performance', category: 'infrastructure', frequency: 2 },
          { issueId: 'iss-003', keyword: 'api_latency', category: 'performance', frequency: 2 },
        ],
        classifiedCount: 3,
      }),

      // Action 4: 傾向分析を実行
      performTrendAnalysis: jest.fn().mockResolvedValue({
        trendSummary: 'Performance issues increasing',
        weeklyTrend: 'upward',
      }),

      // Action 5: 優先度スコアリングを実行（矛盾・異常値を含むレスポンス）
      scorePriority: jest.fn().mockResolvedValue({
        priorityScores: [
          { issueKeyword: 'database_performance', score: 85, rank: 'high' },
          { issueKeyword: 'database_performance', score: 45, rank: 'medium' }, // 同一課題で異なる優先度（矛盾）
          { issueKeyword: 'api_latency', score: 150, rank: 'high' }, // スコアが100超過（異常値）
          { issueKeyword: 'memory_leak', score: -50, rank: 'low' }, // スコアが負数（異常値）
        ],
        scoringValidation: {
          hasContradictions: true,
          contradictingKeywords: ['database_performance'],
          hasAnomalies: true,
          anomalyDetails: [
            { issueKeyword: 'api_latency', score: 150, reason: 'exceeds_max_bound_100' },
            { issueKeyword: 'memory_leak', score: -50, reason: 'below_min_bound_0' },
          ],
        },
      }),

      // Action 6: レポート生成（エスカレーション時には呼ばれないはず）
      generateReport: jest.fn().mockResolvedValue({
        reportId: 'report-001',
        generatedAt: new Date('2024-01-22T09:30:00Z'),
      }),

      // Action 7: 配信処理（エスカレーション時には呼ばれないはず）
      distributeReport: jest.fn().mockResolvedValue({
        distributedAt: new Date('2024-01-22T09:35:00Z'),
        recipientCount: 1,
      }),
    };

    // agentContext を準備: 前週の日報集約完了フラグ、課題分類結果を含める
    const agentContext = {
      executionTimestamp: new Date('2024-01-22T09:00:00Z'),
      analysisStartDate: '2024-01-15',
      analysisEndDate: '2024-01-21',
      teamId: 'team-001',
      reportWeeklyDataAggregated: true,
      previousAggregatedIssueCount: 5,
    };

    // runTx6Imp1Agent を実行
    const result = await runTx6Imp1Agent(agentContext, mockAiClient);

    // AI エージェントが Action 5（優先度スコアリング実行）の結果を検証したことを確認
    expect(mockAiClient.scorePriority).toHaveBeenCalled();

    // エージェントがエスカレーション条件を満たしたと判定していることを確認
    expect(result.status).toBe('escalated');
    expect(result.escalationReason).toBe('contradictory_and_anomalous_analysis_results');

    // 戻り値に矛盾・異常値の詳細が含まれていることを確認
    expect(result.analysisData).toBeDefined();
    expect(result.analysisData.hasContradictions).toBe(true);
    expect(result.analysisData.contradictingKeywords).toContain('database_performance');
    expect(result.analysisData.hasAnomalies).toBe(true);
    expect(result.analysisData.anomalyDetails).toHaveLength(2);
    expect(result.analysisData.anomalyDetails[0]).toEqual({
      issueKeyword: 'api_latency',
      score: 150,
      reason: 'exceeds_max_bound_100',
    });
    expect(result.analysisData.anomalyDetails[1]).toEqual({
      issueKeyword: 'memory_leak',
      score: -50,
      reason: 'below_min_bound_0',
    });

    // 人への引き継ぎ待機状態フラグが true に設定されていることを確認
    expect(result.awaitingHumanReview).toBe(true);

    // Action 6（レポート生成）が呼ばれていないことを確認
    expect(mockAiClient.generateReport).not.toHaveBeenCalled();

    // Action 7（配信処理）が呼ばれていないことを確認
    expect(mockAiClient.distributeReport).not.toHaveBeenCalled();

    // 副作用（レポート配信・通知送信）が未確定の状態にあることを確認
    expect(result.reportId).toBeUndefined();
    expect(result.emailSentAt).toBeUndefined();

    // エージェントが部長へのエスカレーション通知を構成していることを確認
    // 戻り値に escalationNotification が含まれているか、またはエスカレーション情報が十分であることを確認
    expect(result.escalationNotification).toBeDefined();
    if (result.escalationNotification) {
      expect(result.escalationNotification.recipientManagerIds).toBeDefined();
      expect(result.escalationNotification.recipientManagerIds.length).toBeGreaterThan(0);
      expect(result.escalationNotification.payload).toContain('database_performance');
      expect(result.escalationNotification.payload).toContain('矛盾');
      expect(result.escalationNotification.payload).toContain('異常値');
    }

    // 監査ログイベント 'ESCALATION_TRIGGERED_ANALYSIS_VALIDATION_FAILED' が記録されていることを確認
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.eventType).toBe('ESCALATION_TRIGGERED_ANALYSIS_VALIDATION_FAILED');
    expect(result.auditLog.timestamp).toEqual(expect.any(Date));
    expect(result.auditLog.details).toContain('contradictory');
    expect(result.auditLog.details).toContain('anomalous');
  });
});