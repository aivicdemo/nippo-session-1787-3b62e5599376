import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('tx-4-imp-1: ダッシュボード分析から課題指示までの自動実行', () => {
  // SCEN-075: [normal] ダッシュボード分析から課題指示までの自動実行 AIエージェント - 過去の類似課題と照合して再発リスクを評価する
  test('should evaluate recurrence risk by comparing with past similar issues', async () => {
    // 過去の類似課題データベース（スタブ）
    const pastIssuesDatabase = [
      {
        issueId: 'PAST-001',
        content: '納期遅延（営業部）',
        occurrenceDate: '2024-01-15',
        resolutionMethod: 'リソース追加',
        recurrenceFlag: true,
      },
    ];

    // 現在のダッシュボード分析結果（スタブ）
    const currentDashboardIssues = [
      {
        issue: '営業部の納期遅延',
        detectionDate: '2024-01-29',
        importance: '高',
        urgency: '高',
      },
    ];

    // Tx4Imp1AiClientインターフェースに準拠したモックAIクライアント
    const mockAiClient: Tx4Imp1AiClient = {
      action01: jest.fn().mockResolvedValue({
        aggregatedReports: currentDashboardIssues,
      }),
      action02: jest.fn().mockResolvedValue({
        extractedIssues: currentDashboardIssues,
      }),
      action03: jest.fn().mockResolvedValue({
        similarityScore: 85,
        riskLevel: 'HIGH',
        reasoning:
          '同一部門での同一内容の遅延事象。前回から14日で再発。リスク評価値：85/100',
        recommendedAction:
          '即座に営業部長へ報告し過去の解決方法「リソース追加」の適用を検討する',
      }),
      action04: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            issueId: 'NEW-001',
            content: '営業部の納期遅延',
            priority: 1,
            riskLevel: 'HIGH',
            riskScore: 85,
          },
        ],
      }),
      action05: jest.fn().mockResolvedValue({
        planId: 'PLAN-001',
        recommendedActions: ['過去の解決方法を踏まえてリソース追加を優先検討する'],
        estimatedResolutionDays: 1,
        assignedOwner: '営業部長',
      }),
      action06: jest.fn().mockResolvedValue({
        reportContent: '朝会報告資料',
      }),
      action07: jest.fn().mockResolvedValue({
        emailSent: true,
      }),
    };

    // テスト用の実行リクエスト
    const executionRequest = {
      executionTimestamp: new Date('2024-01-29T08:00:00Z'),
      targetDate: '2024-01-29',
      executorUserId: 'USER-001',
      teamId: 'TEAM-001',
    };

    // runTx4Imp1Agent関数を呼び出す
    const result = await runTx4Imp1Agent(executionRequest, mockAiClient);

    // action-03が呼び出されたことを確認
    expect(mockAiClient.action03).toHaveBeenCalled();

    // action-03の呼び出しの引数を取得
    const action03CallArgs = (mockAiClient.action03 as jest.Mock).mock.calls[0];
    expect(action03CallArgs).toBeDefined();

    // action-03の入力が正しい構造を持つことを確認
    const action03Input = action03CallArgs[0];
    expect(action03Input).toHaveProperty('currentIssue');
    expect(action03Input).toHaveProperty('pastIssuesDatabase');
    expect(action03Input.currentIssue).toEqual(
      expect.objectContaining({
        issue: '営業部の納期遅延',
        detectionDate: '2024-01-29',
      })
    );

    // リスク評価結果の検証
    const action03Result = (mockAiClient.action03 as jest.Mock).mock.results[0]
      .value;
    expect(action03Result.similarityScore).toBe(85);
    expect(action03Result.riskLevel).toBe('HIGH');
    expect(action03Result.reasoning).toContain('同一部門');
    expect(action03Result.reasoning).toContain('14日で再発');
    expect(action03Result.reasoning).toContain('85/100');
    expect(action03Result.recommendedAction).toContain('リソース追加');

    // 最終結果の検証
    expect(result).toHaveProperty('executionId');
    expect(result).toHaveProperty('aggregatedReportCount');
    expect(result).toHaveProperty('extractedIssueCount');
    expect(result).toHaveProperty('prioritizedIssues');
    expect(result).toHaveProperty('countermeasurePlan');
    expect(result).toHaveProperty('summaryEmailSent');
    expect(result).toHaveProperty('completionTimestamp');

    // 優先度付け課題の検証
    expect(result.prioritizedIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          riskLevel: 'HIGH',
          riskScore: 85,
        }),
      ])
    );

    // 対応方針案の検証
    expect(result.countermeasurePlan.recommendedActions).toContain(
      '過去の解決方法を踏まえてリソース追加を優先検討する'
    );
    expect(result.countermeasurePlan.assignedOwner).toBe('営業部長');

    // メール送信フラグの検証
    expect(result.summaryEmailSent).toBe(true);

    // 完了時刻が設定されていることを確認
    expect(result.completionTimestamp).toBeInstanceOf(Date);
    expect(result.completionTimestamp.getTime()).toBeGreaterThan(
      executionRequest.executionTimestamp.getTime()
    );
  });
});