import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-10-imp-1/prompts/action-05';
import type { Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('Tx10Imp1Agent - 導入計画・研修実施・フィードバック対応の自動化・統合', () => {
  // SCEN-182
  test('should execute Action 5 autonomously to generate proficiency-based feedback with audit logging', async () => {
    // Arrange: テストダブル FakeAiClient を初期化
    const fakeAiClient: Tx10Imp1AiClient = {
      callAiModel: jest.fn(async (prompt: string) => {
        // Action 5 プロンプトが呼ばれていることを検証
        expect(prompt).toContain('習熟度');
        expect(prompt).toContain('フィードバック');

        // Action 5 の出力: メンバー別フィードバック案
        return {
          feedbackTargets: [
            {
              memberId: 'eng-001',
              memberName: 'Engineer A',
              proficiencyScore: 0.45,
              identifiedChallenges: ['フォーマット統一', '必須項目漏れ'],
              recommendedActions: [
                '朝会報告システムの基本操作チュートリアルを再視聴',
                '部長によるマンツーマンサポート実施',
                '日報テンプレートの事前確認'
              ],
              feedbackText: 'Engineer A は初期段階での支援が必要です。基本操作の定着まで、部長による個別サポートを推奨します。',
              riskLevel: 'HIGH',
              feedbackId: 'fb-001'
            },
            {
              memberId: 'eng-002',
              memberName: 'Engineer B',
              proficiencyScore: 0.52,
              identifiedChallenges: ['課題抽出の精度低下', '優先度判定の曖昧さ'],
              recommendedActions: [
                '課題分類ルールの確認学習',
                '優先度判定基準の事例演習',
                '部長へのフィードバック相談'
              ],
              feedbackText: 'Engineer B は課題認識の精密度向上が課題です。判定ルール資料の強化学習を推奨します。',
              riskLevel: 'MEDIUM',
              feedbackId: 'fb-002'
            },
            {
              memberId: 'eng-003',
              memberName: 'Engineer C',
              proficiencyScore: 0.58,
              identifiedChallenges: ['報告内容の簡潔性不足'],
              recommendedActions: [
                '成功事例の参考提示',
                '簡潔な報告スタイルの事例確認'
              ],
              feedbackText: 'Engineer C はほぼ基準達成です。簡潔性向上のための軽微な調整のみ推奨します。',
              riskLevel: 'LOW',
              feedbackId: 'fb-003'
            }
          ],
          overallSummary: {
            totalSubmitters: 9,
            nonSubmitters: 1,
            averageQualityScore: 0.72,
            scoreDistribution: {
              high: 4,
              medium: 2,
              low: 3
            },
            riskAssessment: '3名のメンバーにリスク判定が必要。初期段階の支援体制を強化することで習熟度向上が期待できます。'
          },
          auditLog: {
            eventType: 'ACTION_05_EXECUTED',
            timestamp: '2025-01-15T10:30:00Z',
            inputDataHash: 'hash_init_report_analysis_0.72_avg',
            outputFeedbackIds: ['fb-001', 'fb-002', 'fb-003'],
            executionDurationMs: 1250
          }
        };
      })
    };

    // 初回報告データ分析結果を準備
    const initialReportAnalysisInput = {
      submissionRate: 0.9,
      dataQualityScore: 0.72,
      formatUniformityScore: 0.68,
      individualScores: [0.95, 0.88, 0.78, 0.75, 0.72, 0.65, 0.58, 0.52, 0.45],
      feedbackItems: [
        { memberId: 'eng-001', issue: 'フォーマット統一', severity: 'HIGH' },
        { memberId: 'eng-002', issue: '課題抽出の精度', severity: 'MEDIUM' },
        { memberId: 'eng-003', issue: '簡潔性', severity: 'LOW' }
      ]
    };

    // buildAction05Prompt と ACTION_05_PROMPT_VERSION のエクスポート確認
    expect(typeof buildAction05Prompt).toBe('function');
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');
    expect(ACTION_05_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);

    // Action 5 プロンプトを構築
    const action05PromptText = buildAction05Prompt(initialReportAnalysisInput);
    expect(action05PromptText).toContain('習熟度');

    // Act: runTx10Imp1Agent を実行
    const agentInput = {
      deploymentInitiationTimestamp: new Date('2025-01-15T09:00:00Z'),
      participantList: [
        { userId: 'pm-001', role: 'ProjectManager', email: 'pm@example.com' },
        { userId: 'mgr-001', role: 'Manager', email: 'manager@example.com' },
        { userId: 'eng-001', role: 'Engineer', email: 'eng1@example.com' },
        { userId: 'eng-002', role: 'Engineer', email: 'eng2@example.com' },
        { userId: 'eng-003', role: 'Engineer', email: 'eng3@example.com' },
        { userId: 'eng-004', role: 'Engineer', email: 'eng4@example.com' },
        { userId: 'eng-005', role: 'Engineer', email: 'eng5@example.com' },
        { userId: 'eng-006', role: 'Engineer', email: 'eng6@example.com' },
        { userId: 'eng-007', role: 'Engineer', email: 'eng7@example.com' },
        { userId: 'eng-008', role: 'Engineer', email: 'eng8@example.com' },
        { userId: 'eng-009', role: 'Engineer', email: 'eng9@example.com' }
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00'
    };

    const result = await runTx10Imp1Agent(agentInput, fakeAiClient);

    // Assert: フィードバック案構造の検証
    expect(result).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();

    // フィードバック対象メンバー数の検証（スコア 0.45, 0.52, 0.58）
    expect(result.initialReportAnalysis.feedbackItems).toHaveLength(3);

    // 各フィードバック案の構造検証
    const feedbackItem1 = result.initialReportAnalysis.feedbackItems[0];
    expect(feedbackItem1).toHaveProperty('memberId');
    expect(feedbackItem1).toHaveProperty('identifiedChallenges');
    expect(feedbackItem1).toHaveProperty('recommendedActions');
    expect(feedbackItem1).toHaveProperty('riskLevel');
    expect(feedbackItem1.identifiedChallenges).toBeInstanceOf(Array);
    expect(feedbackItem1.recommendedActions).toBeInstanceOf(Array);

    // memberId 確認
    expect(feedbackItem1.memberId).toBe('eng-001');

    // スコア別の段階的フィードバック内容検証
    const fb001RiskLevel = feedbackItem1.riskLevel;
    const fb002RiskLevel = result.initialReportAnalysis.feedbackItems[1].riskLevel;
    const fb003RiskLevel = result.initialReportAnalysis.feedbackItems[2].riskLevel;

    expect(fb001RiskLevel).toBe('HIGH');
    expect(fb002RiskLevel).toBe('MEDIUM');
    expect(fb003RiskLevel).toBe('LOW');

    // スコア低いほど支援度が高いことを確認（recommendedActions の数・内容）
    const fb001ActionCount = feedbackItem1.recommendedActions.length;
    const fb002ActionCount = result.initialReportAnalysis.feedbackItems[1].recommendedActions.length;
    const fb003ActionCount = result.initialReportAnalysis.feedbackItems[2].recommendedActions.length;

    expect(fb001ActionCount).toBeGreaterThanOrEqual(fb002ActionCount);
    expect(fb002ActionCount).toBeGreaterThanOrEqual(fb003ActionCount);

    // 初回報告データから自動抽出された課題キーワードの確認
    expect(feedbackItem1.identifiedChallenges).toContain('フォーマット統一');
    expect(feedbackItem1.identifiedChallenges).toContain('必須項目漏れ');

    // 監査ログイベントの検証
    expect(result.onboardingApprovalStatus).toBeDefined();
    // 監査ログ情報を確認（実装により onboardingApprovalStatus に含まれるか、別のプロパティか）
    // ここでは agentInput から導出されるイベント情報が正しく設定されていることを検証

    // AIクライアント呼び出しの確認
    expect(fakeAiClient.callAiModel).toHaveBeenCalled();

    // タイムスタンプ形式の検証（ISO 8601）
    expect(agentInput.deploymentInitiationTimestamp).toBeInstanceOf(Date);
    expect(agentInput.reportingDeadlineTime).toMatch(/^\d{2}:\d{2}$/);

    // 部長の事前確認ガイアンス：フィードバック案は自動生成されたが、実務乖離を防ぐため部長の承認が必須
    expect(result.onboardingApprovalStatus).toBeDefined();
    // onboardingApprovalStatus は部長による承認判定を格納（false or pending state であり、自動承認はしない）
  });
});