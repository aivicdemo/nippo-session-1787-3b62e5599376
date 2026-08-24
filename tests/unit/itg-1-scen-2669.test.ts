import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
} from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1: 朝会報告初期導入・ユーザー教育フロー', () => {
  // SCEN-2669
  test('複数エンジニアの段階的サポート - 同じ理由で連続不合格時に異なるサポート内容を提供', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // シナリオ: エンジニアA が「課題記述が不十分」で初回不合格
    // 初回不合格時: TextAnalysisServiceAdapter が低い詳細度スコアを返す
    mockTextAnalysisAdapter.extractKeywords.mockResolvedValueOnce({
      keywords: [
        { keyword: 'database_issue', frequency: 1, confidence: 0.45 },
      ],
      detailScore: 35,
      analysisMetadata: {
        executedAt: '2024-01-15T10:00:00Z',
        reason: 'insufficient_detail',
      },
    });

    mockTextAnalysisAdapter.assessImpactScore.mockResolvedValueOnce({
      impactScore: 42,
      severity: 'low',
      analysisVersion: 'v1.0',
    });

    const inputFirstAttempt: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: [
        {
          userId: 'eng_A_001',
          role: 'Engineer',
          email: 'eng.a@example.com',
        },
        {
          userId: 'eng_B_002',
          role: 'Engineer',
          email: 'eng.b@example.com',
        },
        {
          userId: 'eng_C_003',
          role: 'Engineer',
          email: 'eng.c@example.com',
        },
        {
          userId: 'eng_D_004',
          role: 'Engineer',
          email: 'eng.d@example.com',
        },
        {
          userId: 'eng_E_005',
          role: 'Engineer',
          email: 'eng.e@example.com',
        },
        {
          userId: 'eng_F_006',
          role: 'Engineer',
          email: 'eng.f@example.com',
        },
        {
          userId: 'eng_G_007',
          role: 'Engineer',
          email: 'eng.g@example.com',
        },
        {
          userId: 'eng_H_008',
          role: 'Engineer',
          email: 'eng.h@example.com',
        },
        {
          userId: 'eng_I_009',
          role: 'Engineer',
          email: 'eng.i@example.com',
        },
        {
          userId: 'eng_J_010',
          role: 'Engineer',
          email: 'eng.j@example.com',
        },
        {
          userId: 'pm_001',
          role: 'ProjectManager',
          email: 'pm@example.com',
        },
        {
          userId: 'manager_001',
          role: 'Manager',
          email: 'manager@example.com',
        },
      ],
      preparationDaysRequired: 3,
      reportingDeadlineTime: '09:00',
    };

    // 初回テスト報告実行（エンジニアA が初回不合格）
    const outputFirstAttempt: Tx10AgentOutput = await runTx10Imp1Agent(
      inputFirstAttempt,
      {
        textAnalysis: mockTextAnalysisAdapter,
        notification: mockNotificationAdapter,
      }
    );

    // 初回不合格を確認（提出率90%未満、品質スコア80点未満、形式統一度85%未満のいずれかを満たさない）
    expect(outputFirstAttempt.initialReportAnalysis.submissionRate).toBeLessThan(
      90
    );

    // 初回不合格時のフィードバックを確認
    const firstAttemptFeedback =
      outputFirstAttempt.initialReportAnalysis.feedbackItems;
    expect(firstAttemptFeedback).toBeDefined();
    expect(firstAttemptFeedback.length).toBeGreaterThan(0);

    // エンジニアA の初回不合格理由を特定: 「詳細度が低い」ことを示すサポート
    const engAFirstFeedback = firstAttemptFeedback.find(
      (item) => item.engineerId === 'eng_A_001'
    );
    expect(engAFirstFeedback).toBeDefined();
    expect(engAFirstFeedback?.supportContent).toMatch(
      /テキスト|ガイダンス|3要素|What.*Why.*Impact/i
    );

    // 初回サポート内容は「テキスト指示型」であることを確認
    const firstSupportType = 'text_guidance';
    expect(engAFirstFeedback?.supportContent).toBeTruthy();

    // 2回目テスト報告：エンジニアA が同じ理由「課題記述が不十分」で再度不合格に至る前に
    // システムが不合格履歴を参照する
    // 2回目不合格時: TextAnalysisServiceAdapter が異なる分析結果を返す
    // （今回は「影響度スコア」に着眼した結果）
    mockTextAnalysisAdapter.extractKeywords.mockResolvedValueOnce({
      keywords: [
        {
          keyword: 'database_performance',
          frequency: 2,
          confidence: 0.72,
        },
        { keyword: 'deployment_risk', frequency: 1, confidence: 0.58 },
      ],
      detailScore: 52,
      analysisMetadata: {
        executedAt: '2024-01-15T11:30:00Z',
        reason: 'insufficient_impact_score',
      },
    });

    mockTextAnalysisAdapter.assessImpactScore.mockResolvedValueOnce({
      impactScore: 68,
      severity: 'medium',
      analysisVersion: 'v1.0',
    });

    // 2回目テスト報告実行
    const outputSecondAttempt: Tx10AgentOutput = await runTx10Imp1Agent(
      inputFirstAttempt,
      {
        textAnalysis: mockTextAnalysisAdapter,
        notification: mockNotificationAdapter,
      }
    );

    // 2回目不合格であっても同じ理由で再度不合格となるまでに
    // 異なるサポート内容が提供されることを確認
    const secondAttemptFeedback =
      outputSecondAttempt.initialReportAnalysis.feedbackItems;
    expect(secondAttemptFeedback).toBeDefined();
    expect(secondAttemptFeedback.length).toBeGreaterThan(0);

    // エンジニアA の2回目不合格時のフィードバックを確認
    const engASecondFeedback = secondAttemptFeedback.find(
      (item) => item.engineerId === 'eng_A_001'
    );
    expect(engASecondFeedback).toBeDefined();

    // 2回目サポート内容は「テンプレート形式」または「具体例形式」であることを確認
    // 初回の「テキスト指示」と異なることを確認
    const secondSupportType = 'template_or_examples';
    expect(engASecondFeedback?.supportContent).toMatch(
      /テンプレート|具体例|選択肢|記入例/i
    );

    // 初回と2回目のサポート内容が異なることを明示的に確認
    expect(engASecondFeedback?.supportContent).not.toBe(
      engAFirstFeedback?.supportContent
    );

    // 同一理由での連続不合格であっても、提示されるサポート形式が段階的に異なることで
    // エンジニアの学習機会が確保されることを確認
    expect(engAFirstFeedback?.supportContent).toMatch(/3要素|What.*Why.*Impact/i);
    expect(engASecondFeedback?.supportContent).not.toMatch(/3要素|What.*Why.*Impact/i);

    // onboardingApprovalStatus は初回・2回目ともに「未承認」であることを確認
    // （提出率90%未満のため）
    expect(outputFirstAttempt.onboardingApprovalStatus.approved).toBe(false);
    expect(outputSecondAttempt.onboardingApprovalStatus.approved).toBe(false);

    // TextAnalysisServiceAdapter が複数回呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(2);
  });
});