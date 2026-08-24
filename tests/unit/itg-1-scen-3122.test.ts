import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1: 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  test('SCEN-3122: AI出力の低確信度（0.35）を検出してエスカレーション状態で安全に引き継ぐ', async () => {
    // Arrange: モック化したTextAnalysisServiceAdapterを構築
    const mockAiClient: Tx3Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database_connection_timeout', frequency: 3, confidence: 0.35 },
          { keyword: 'memory_leak_issue', frequency: 2, confidence: 0.35 },
          { keyword: 'api_response_delay', frequency: 2, confidence: 0.35 },
          { keyword: 'test_coverage_gap', frequency: 1, confidence: 0.35 },
          { keyword: 'deployment_script_bug', frequency: 1, confidence: 0.35 },
        ],
        aggregatedConfidence: 0.35,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
      sendNotification: jest.fn(),
    };

    const input = {
      aggregatedReportIds: ['report-001', 'report-002', 'report-003', 'report-004', 'report-005'],
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-08T23:59:59Z',
      managerUserId: 'manager-uuid-001',
      priorityThresholdScore: 70,
    };

    // Act: runTx3Imp1Agentを実行
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert: 低確信度出力を理由とするエスカレーション状態を検証
    expect(result.status).toBe('escalation_required');
    expect(result.reason).toBe('low_confidence_output');
    expect(result.confidence_score).toBe(0.35);
    expect(result.threshold).toBe(0.6);
    expect(result.escalation_target).toBe('section_manager');
    expect(result.action).toBe('manual_review_required');

    // Assert: executionIdが生成されていることを確認（監査可能性）
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    // Assert: エスカレーション時の完了タイムスタンプ
    expect(result.completionTimestamp).toBeDefined();
    expect(result.completionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Assert: 低確信度によるエスカレーション時の抽出課題件数は0を返す
    expect(result.extractedIssuesCount).toBe(0);

    // Assert: 優先度別課題リストは空を返す
    expect(result.prioritizedIssuesList).toEqual([]);

    // Assert: 確認メール送信は実行されない（escalation_requiredステータスのため）
    expect(result.emailSendStatus).toBe('pending');

    // Assert: 監査ログに信頼度不足の記録が含まれることを検証
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog).toContain('confidence');
    expect(result.auditLog).toContain('0.35');
    expect(result.auditLog).toContain('escalation');

    // Assert: extractKeywordsメソッドが呼び出されたことを確認
    expect(mockAiClient.extractKeywords).toHaveBeenCalledTimes(1);

    // Assert: 低確信度によりassessImpactScoreは呼び出されていないことを確認
    expect(mockAiClient.assessImpactScore).not.toHaveBeenCalled();

    // Assert: 低確信度によりsendNotificationは呼び出されていないことを確認
    expect(mockAiClient.sendNotification).not.toHaveBeenCalled();
  });
});