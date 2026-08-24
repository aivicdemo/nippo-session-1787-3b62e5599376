import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('Tx10 初回報告データ品質評価機能 - 形式統一度85%以上だが他2条件未達で改善フェーズへの戻り指示', () => {
  test('SCEN-2608: 品質評価結果が形式統一度OK・完全性NG・正確性NGで改善フェーズ戻り遷移を指示', async () => {
    // テストデータ準備：初回報告データ
    const mockDeploymentParticipants = [
      { userId: 'eng001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'eng009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'eng010', role: 'Engineer', email: 'eng010@example.com' },
      { userId: 'pm001', role: 'ProjectManager', email: 'pm001@example.com' },
      { userId: 'manager001', role: 'Manager', email: 'manager001@example.com' },
    ];

    const mockInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: mockDeploymentParticipants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // TextAnalysisServiceAdapterのスタブ化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['デザイン検証', 'API統合', 'パフォーマンス'],
        frequencies: [15, 12, 8],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 72,
        severity: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    // NotificationServiceAdapterのスタブ化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ delivered: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    // runTx10Imp1Agentを呼び出し
    const result = await runTx10Imp1Agent(mockInput, {
      textAnalysisService: mockTextAnalysisServiceAdapter,
      notificationService: mockNotificationServiceAdapter,
    });

    // 品質評価結果の検証
    expect(result).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();
    
    // 提出率の検証（10名全員提出想定）
    expect(result.initialReportAnalysis.submissionRate).toBe(100);
    
    // データ品質スコアの検証（完全性50%が反映）
    expect(result.initialReportAnalysis.dataQualityScore).toBe(50);
    
    // 形式統一度の検証（85%で基準値を満たす）
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(85);
    
    // 承認ステータスの検証（他の条件未達で却下）
    expect(result.onboardingApprovalStatus.approvalDecision).toBe('REJECTED');
    expect(result.onboardingApprovalStatus.canProceedToProduction).toBe(false);
    
    // 推奨アクションの検証（改善フェーズへの戻り指示）
    expect(result.onboardingApprovalStatus.recommendedAction).toBe('RETURN_TO_IMPROVEMENT_PHASE');
    
    // フィードバック内容の検証
    expect(result.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(result.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(0);
    
    // フィードバックに完全性・正確性の改善指示が含まれることを検証
    const feedbackMessages = result.initialReportAnalysis.feedbackItems
      .map((item: { message?: string; feedback?: string }) => 
        item.message || item.feedback || ''
      )
      .join(' ');
    
    expect(feedbackMessages).toMatch(/完全性/);
    expect(feedbackMessages).toMatch(/正確性/);
  });
});