import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentInput, type Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('tx-11-imp-1: 日報収集・確認・催促の自動化エージェント', () => {
  // SCEN-205: [error] 課題の優先度付けが不確実な場合は部長に判断を仰ぐ
  test('should escalate to manager when priority confidence is below threshold', async () => {
    // Arrange: テスト用フェイク AI クライアント初期化
    const mockAiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({ prompt: 'action-01' }),
      buildAction02Prompt: jest.fn().mockResolvedValue({ prompt: 'action-02' }),
      buildAction03Prompt: jest.fn().mockResolvedValue({ prompt: 'action-03' }),
      buildAction04Prompt: jest.fn().mockResolvedValue({ prompt: 'action-04' }),
      // Action 5: 優先度判定が不確実な応答を返す
      buildAction05Prompt: jest.fn().mockResolvedValue({
        prompt: 'action-05',
        confidence: 0.35, // 閾値 0.5 未満 → 不確実
        priorityJudgment: 'UNCERTAIN',
        uncertainIssueId: 'issue-001',
        recommendedPriority: 'HIGH',
        similarIssues: [
          { id: 'past-issue-A', title: '類似課題A', resolution: '過去の対応内容' }
        ]
      }),
      buildAction06Prompt: jest.fn().mockResolvedValue({ prompt: 'action-06' }),
      buildAction07Prompt: jest.fn().mockResolvedValue({ prompt: 'action-07' })
    };

    const agentInput: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T08:00:00Z'),
      teamId: 'team-001',
      reportDeadlineTime: '08:30',
      managerEmail: 'manager@example.com'
    };

    // Act: エージェント実行（優先度判定が不確実なシナリオ）
    const result = await runTx11Imp1Agent(agentInput, mockAiClient);

    // Assert: escalation_triggered イベントが発行されたことを確認
    expect(result).toHaveProperty('escalationTriggered');
    expect(result.escalationTriggered).toBe(true);
    expect(result.escalationType).toBe('priority_uncertainty');

    // Assert: ハンドオフペイロードに必要な情報が含まれていることを確認
    expect(result.handoffPayload).toBeDefined();
    expect(result.handoffPayload.uncertainIssue).toBeDefined();
    expect(result.handoffPayload.uncertainIssue.id).toBe('issue-001');
    expect(result.handoffPayload.confidenceScore).toBe(0.35);

    // Assert: 参考情報（過去の同一課題・類似事例）が含まれていることを確認
    expect(result.handoffPayload.similarIssues).toBeDefined();
    expect(result.handoffPayload.similarIssues.length).toBeGreaterThan(0);
    expect(result.handoffPayload.similarIssues[0].id).toBe('past-issue-A');

    // Assert: 推奨優先度案（参考情報）が含まれていることを確認
    expect(result.handoffPayload.recommendedPriority).toBe('HIGH');

    // Assert: 部長への最終的なサマリー配信がまだ実行されていないことを確認
    expect(result.summaryEmailSent).toBe(false);

    // Assert: 催促通知がまだ送信されていないことを確認
    expect(result.notificationsSent).toEqual([]);

    // Assert: 監査ログに escalation_triggered: priority_uncertainty が記録されていることを確認
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.events).toBeDefined();
    const escalationEvent = result.auditLog.events.find(
      (event: any) => event.type === 'escalation_triggered' && event.reason === 'priority_uncertainty'
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent.timestamp).toBeDefined();
    expect(escalationEvent.details).toHaveProperty('uncertainIssueId', 'issue-001');
    expect(escalationEvent.details).toHaveProperty('confidenceScore', 0.35);

    // Assert: マネージャーへのハンドオフ状態が確認されることを確認
    expect(result.status).toBe('awaiting_manager_decision');
    expect(result.handoffTargetEmail).toBe('manager@example.com');
  });
});