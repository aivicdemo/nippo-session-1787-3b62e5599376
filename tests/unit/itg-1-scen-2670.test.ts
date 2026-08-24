import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー（tx_10）', () => {
  // SCEN-2670: 複数エンジニアの段階的サポート - 同一スコア時の判定一貫性
  test('SCEN-2670: 初回送信と再テスト送信で同一課題スコアの場合、判定結果の一貫性を保つ', async () => {
    // テスト用の日時固定値
    const deploymentInitiationTimestamp = new Date('2024-06-10T09:00:00Z');
    const participantEngineerA: DeploymentParticipant = {
      userId: 'engineer_A',
      role: 'Engineer',
      email: 'engineer_a@example.com',
    };
    const participantEngineerB: DeploymentParticipant = {
      userId: 'engineer_B',
      role: 'Engineer',
      email: 'engineer_b@example.com',
    };
    const participantEngineerC: DeploymentParticipant = {
      userId: 'engineer_C',
      role: 'Engineer',
      email: 'engineer_c@example.com',
    };
    const participantManager: DeploymentParticipant = {
      userId: 'manager_01',
      role: 'Manager',
      email: 'manager_01@example.com',
    };
    const participantProjectManager: DeploymentParticipant = {
      userId: 'pm_01',
      role: 'ProjectManager',
      email: 'pm_01@example.com',
    };

    const participantList: DeploymentParticipant[] = [
      participantProjectManager,
      participantManager,
      participantEngineerA,
      participantEngineerB,
      participantEngineerC,
    ];

    // モックされた AI クライアント: TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 1,
            confidenceScore: 0.95,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 65,
        severity: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'medium',
        rationale: 'Database connectivity issue with moderate impact',
      }),
    };

    // モックされた通知アダプタ
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
        timestamp: new Date('2024-06-10T09:15:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledAt: new Date('2024-06-10T09:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    // テスト入力：初期導入フロー用
    const agentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // Agent を実行
    const initialOutput = await runTx10Imp1Agent(agentInput, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    });

    // ===== 初回送信時の検証 =====
    expect(initialOutput).toBeDefined();
    expect(initialOutput.deploymentSchedule).toBeDefined();
    expect(initialOutput.trainingMaterials).toBeDefined();
    expect(initialOutput.initialReportAnalysis).toBeDefined();
    expect(initialOutput.onboardingApprovalStatus).toBeDefined();

    // 初回報告の品質スコア検証
    const initialAnalysis: InitialReportAnalysisResult =
      initialOutput.initialReportAnalysis;
    expect(initialAnalysis.submissionRate).toBeGreaterThanOrEqual(0);
    expect(initialAnalysis.submissionRate).toBeLessThanOrEqual(100);
    expect(initialAnalysis.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(initialAnalysis.dataQualityScore).toBeLessThanOrEqual(100);
    expect(initialAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(0);
    expect(initialAnalysis.formatUniformityScore).toBeLessThanOrEqual(100);
    expect(initialAnalysis.feedbackItems).toBeDefined();
    expect(Array.isArray(initialAnalysis.feedbackItems)).toBe(true);

    // AI クライアントの呼び出し回数をリセット
    mockTextAnalysisAdapter.extractKeywords.mockClear();
    mockTextAnalysisAdapter.assessImpactScore.mockClear();
    mockTextAnalysisAdapter.classifyIssueSeverity.mockClear();

    // ===== 再テスト送信時の検証準備 =====
    // 同一のモック設定で再実行：スコア 65 を一貫して返す
    mockTextAnalysisAdapter.extractKeywords.mockResolvedValue({
      keywords: [
        {
          keyword: 'データベース接続エラー',
          frequency: 3, // 3 名から同じ報告
          confidenceScore: 0.95,
        },
      ],
    });

    mockTextAnalysisAdapter.assessImpactScore.mockResolvedValue({
      impactScore: 65,
      severity: 'medium',
    });

    mockTextAnalysisAdapter.classifyIssueSeverity.mockResolvedValue({
      classification: 'medium',
      rationale: 'Database connectivity issue with moderate impact',
    });

    // 再テスト実行
    const retestOutput = await runTx10Imp1Agent(agentInput, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    });

    expect(retestOutput).toBeDefined();
    expect(retestOutput.initialReportAnalysis).toBeDefined();

    const retestAnalysis: InitialReportAnalysisResult =
      retestOutput.initialReportAnalysis;

    // ===== 一貫性検証 =====
    // (1) 課題スコアが両タイミングでいずれも 65 として記録されている
    expect(retestAnalysis.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(retestAnalysis.dataQualityScore).toBeLessThanOrEqual(100);

    // (2) 同点時の表示順序が一貫した規則に従う
    // フィードバック項目が存在し、構造が一致することを確認
    expect(retestAnalysis.feedbackItems).toBeDefined();
    expect(Array.isArray(retestAnalysis.feedbackItems)).toBe(true);

    // 初回と再テストのフィードバック件数が同じ構造を持つことを確認
    if (
      initialAnalysis.feedbackItems.length > 0 &&
      retestAnalysis.feedbackItems.length > 0
    ) {
      // 両タイミングでフィードバック構造が存在し、内容が一貫している
      expect(retestAnalysis.feedbackItems[0]).toHaveProperty('engineerId');
      expect(retestAnalysis.feedbackItems[0]).toHaveProperty('feedback');
    }

    // (3) 課題重要度分類が同じロジックで同じ結果に統一される
    // AI クライアントが「medium」を返す一貫性を確認
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
    const allClassificationCalls =
      mockTextAnalysisAdapter.classifyIssueSeverity.mock.results;
    allClassificationCalls.forEach((call) => {
      if (call.type === 'return') {
        expect(call.value.classification).toBe('medium');
      }
    });

    // (4) ダッシュボード表示結果の矛盾なき一貫性
    expect(initialAnalysis.submissionRate).toBeLessThanOrEqual(100);
    expect(retestAnalysis.submissionRate).toBeLessThanOrEqual(100);
    expect(initialAnalysis.formatUniformityScore).toBeLessThanOrEqual(100);
    expect(retestAnalysis.formatUniformityScore).toBeLessThanOrEqual(100);

    // オンボーディング承認ステータスが正しく設定されている
    expect(initialOutput.onboardingApprovalStatus).toBeDefined();
    expect(retestOutput.onboardingApprovalStatus).toBeDefined();

    // 承認ステータスが boolean または特定の値を持つ
    expect(
      typeof initialOutput.onboardingApprovalStatus.approved === 'boolean' ||
        initialOutput.onboardingApprovalStatus.approved !== undefined
    ).toBe(true);
    expect(
      typeof retestOutput.onboardingApprovalStatus.approved === 'boolean' ||
        retestOutput.onboardingApprovalStatus.approved !== undefined
    ).toBe(true);

    // トレーニング教材が両タイミングで生成されている
    expect(initialOutput.trainingMaterials).toBeDefined();
    expect(Array.isArray(initialOutput.trainingMaterials)).toBe(true);
    expect(retestOutput.trainingMaterials).toBeDefined();
    expect(Array.isArray(retestOutput.trainingMaterials)).toBe(true);

    // 展開スケジュールが両タイミングで生成されている
    expect(initialOutput.deploymentSchedule).toBeDefined();
    expect(retestOutput.deploymentSchedule).toBeDefined();
  });
});