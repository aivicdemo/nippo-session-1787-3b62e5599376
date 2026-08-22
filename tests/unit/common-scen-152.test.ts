import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('Tx8Imp1Agent - Orchestration', () => {
  // SCEN-152: [error] 課題検索から可視化レポート作成までの自動実行 AIエージェント - 分析結果に矛盾がある場合、副作用確定前に人へ引き継ぐ
  test('should escalate to human when analysis results contain contradictions without committing side effects', async () => {
    // Setup: テスト用の朝会報告管理システム API スタブを初期化
    const mockIssueData = [
      {
        issueId: 'ISS-001',
        title: 'Database connection timeout',
        reportedAt: '2024-01-15T08:00:00Z',
        category: 'infrastructure',
      },
      {
        issueId: 'ISS-002',
        title: 'API response delay',
        reportedAt: '2024-01-15T08:15:00Z',
        category: 'performance',
      },
      {
        issueId: 'ISS-003',
        title: 'Memory leak in service A',
        reportedAt: '2024-01-15T08:30:00Z',
        category: 'infrastructure',
      },
      {
        issueId: 'ISS-004',
        title: 'Database connection timeout',
        reportedAt: '2024-01-14T09:00:00Z',
        category: 'infrastructure',
      },
      {
        issueId: 'ISS-005',
        title: 'Cache invalidation issue',
        reportedAt: '2024-01-15T09:00:00Z',
        category: 'performance',
      },
      {
        issueId: 'ISS-006',
        title: 'API response delay',
        reportedAt: '2024-01-14T10:00:00Z',
        category: 'performance',
      },
      {
        issueId: 'ISS-007',
        title: 'Disk space warning',
        reportedAt: '2024-01-15T09:30:00Z',
        category: 'infrastructure',
      },
      {
        issueId: 'ISS-008',
        title: 'Memory leak in service A',
        reportedAt: '2024-01-13T11:00:00Z',
        category: 'infrastructure',
      },
      {
        issueId: 'ISS-009',
        title: 'Database connection timeout',
        reportedAt: '2024-01-13T14:00:00Z',
        category: 'infrastructure',
      },
      {
        issueId: 'ISS-010',
        title: 'API response delay',
        reportedAt: '2024-01-12T15:00:00Z',
        category: 'performance',
      },
    ];

    // Setup: テスト用の AI クライアント（Tx8Imp1AiClient）のモック実装を作成
    // 分析結果に矛盾を含むレスポンスを返すように設定
    const mockAiClient = {
      // Action 1: 課題データ抽出 - 10件の課題を取得
      action01ExtractIssueData: jest
        .fn()
        .mockResolvedValue({
          issuesExtracted: mockIssueData,
          extractionStatus: 'completed',
          extractedCount: 10,
        }),

      // Action 2: 時系列分析 - 再発パターン A を判定
      action02TimeSeriesAnalysis: jest
        .fn()
        .mockResolvedValue({
          timeSeriesPatterns: [
            {
              patternId: 'PATTERN-A',
              affectedIssueIds: ['ISS-001', 'ISS-004', 'ISS-009'],
              patternType: 'recurring',
              description:
                'Database connection timeout recurring every 24 hours',
              firstOccurrence: '2024-01-13T14:00:00Z',
              lastOccurrence: '2024-01-15T08:00:00Z',
              occurrenceCount: 3,
              severity: 'high',
            },
          ],
          analysisStatus: 'completed',
        }),

      // Action 3: ボトルネック特定 - 同じ課題に対して矛盾するパターン B を判定
      action03IdentifyBottleneck: jest
        .fn()
        .mockResolvedValue({
          bottleneckPatterns: [
            {
              patternId: 'PATTERN-B',
              affectedIssueIds: ['ISS-001', 'ISS-004', 'ISS-009'],
              patternType: 'sporadic',
              description:
                'Database connection timeout is sporadic with no clear pattern',
              firstOccurrence: '2024-01-13T14:00:00Z',
              lastOccurrence: '2024-01-15T08:00:00Z',
              occurrenceCount: 3,
              severity: 'medium',
              contradictionReason:
                'Time series analysis identified recurring pattern but bottleneck analysis shows sporadic behavior',
            },
          ],
          analysisStatus: 'completed',
          hasContradiction: true,
        }),

      // Action 4: 可視化レポート生成
      action04GenerateVisualization: jest.fn(),

      // Action 5: 部長への提示
      action05PresentToManager: jest.fn(),
    };

    // Setup: 監査ログ記録用のモック
    const auditLog: Array<{
      eventType: string;
      timestamp: string;
      escalationReason?: string;
      contradictionDetails?: object;
    }> = [];

    const mockAuditLogger = {
      logEscapeToHuman: jest.fn((reason: string, details: object) => {
        auditLog.push({
          eventType: 'escapeToHuman',
          timestamp: new Date('2024-01-15T11:00:00Z').toISOString(),
          escalationReason: reason,
          contradictionDetails: details,
        });
      }),
    };

    // Setup: 人への引き継ぎハンドラー
    let humanHandoffCalled = false;
    let handoffEscalationData: {
      contradictions: Array<{
        patternA: object;
        patternB: object;
        affectedIssues: string[];
      }>;
      extractedIssues: Array<object>;
      intermediateAnalysisState: object;
      escalationReason: string;
    } | null = null;

    const mockHumanHandoffHandler = jest.fn((escalationData) => {
      humanHandoffCalled = true;
      handoffEscalationData = escalationData;
    });

    // Action: runTx8Imp1Agent 関数を実行
    const analysisInput = {
      analysisPeriodStartDate: '2024-01-12T00:00:00Z',
      analysisPeriodEndDate: '2024-01-15T23:59:59Z',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10,
    };

    // オーケストレーターの実行
    const result = await runTx8Imp1Agent(
      analysisInput,
      mockAiClient,
      mockAuditLogger,
      mockHumanHandoffHandler
    );

    // Verify: Action 1〜3 が正常に実行されたことを確認
    expect(mockAiClient.action01ExtractIssueData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02TimeSeriesAnalysis).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action03IdentifyBottleneck).toHaveBeenCalledTimes(1);

    // Verify: escapeToHuman フラグが true に設定されたことを確認
    expect(result.escapeToHuman).toBe(true);

    // Verify: 矛盾検出ロジックが実行されたことを確認
    expect(result.analysisStatus).toBe('failed');

    // Verify: 副作用（可視化レポート生成や部長への提示）がコミットされていないことを確認
    expect(mockAiClient.action04GenerateVisualization).not.toHaveBeenCalled();
    expect(mockAiClient.action05PresentToManager).not.toHaveBeenCalled();

    // Verify: 人への引き継ぎハンドラーが呼び出されたことを確認
    expect(humanHandoffCalled).toBe(true);
    expect(mockHumanHandoffHandler).toHaveBeenCalledTimes(1);

    // Verify: 引き継ぎ時に矛盾内容の情報が人へ渡されたことを確認
    expect(handoffEscalationData).not.toBeNull();
    expect(handoffEscalationData?.escalationReason).toBe(
      'contradictions_in_analysis_results'
    );

    // Verify: 引き継ぎ時に抽出された課題データ（10件）が渡されたことを確認
    expect(handoffEscalationData?.extractedIssues).toHaveLength(10);
    expect(handoffEscalationData?.extractedIssues[0]).toEqual(
      expect.objectContaining({
        issueId: 'ISS-001',
        title: 'Database connection timeout',
      })
    );

    // Verify: 引き継ぎ時に矛盾内容（パターン A とパターン B の対象課題・判定理由の差分）が渡されたことを確認
    expect(handoffEscalationData?.contradictions).toBeDefined();
    expect(handoffEscalationData?.contradictions).toHaveLength(1);
    expect(handoffEscalationData?.contradictions[0].patternA).toEqual(
      expect.objectContaining({
        patternType: 'recurring',
      })
    );
    expect(handoffEscalationData?.contradictions[0].patternB).toEqual(
      expect.objectContaining({
        patternType: 'sporadic',
      })
    );
    expect(handoffEscalationData?.contradictions[0].affectedIssues).toEqual([
      'ISS-001',
      'ISS-004',
      'ISS-009',
    ]);

    // Verify: 分析結果の中間状態が渡されたことを確認
    expect(handoffEscalationData?.intermediateAnalysisState).toBeDefined();
    expect(handoffEscalationData?.intermediateAnalysisState).toEqual(
      expect.objectContaining({
        timeSeriesAnalysisCompleted: true,
        bottleneckAnalysisCompleted: true,
      })
    );

    // Verify: 監査ログに escapeToHuman イベントが記録されたことを確認
    expect(mockAuditLogger.logEscapeToHuman).toHaveBeenCalledTimes(1);
    expect(auditLog).toHaveLength(1);
    expect(auditLog[0]).toEqual(
      expect.objectContaining({
        eventType: 'escapeToHuman',
        escalationReason: 'contradictions_in_analysis_results',
      })
    );

    // Verify: 可視化レポートが生成されないことを確認
    expect(result.reportId).toBeUndefined();

    // Verify: 部長への通知が送信されないことを確認
    expect(result.reportDeliveryStatus).not.toBe('sent');

    // Verify: 分析結果が返却されていないことを確認
    expect(result.analysisStatus).toBe('failed');
    expect(result.recurringIssueCount).toBeUndefined();
  });
});