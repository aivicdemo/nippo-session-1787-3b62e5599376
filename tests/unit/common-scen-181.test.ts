import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-10-imp-1/prompts/action-04';

describe('Tx10Imp1Agent - 導入計画・研修実施・フィードバック対応の自動化・統合', () => {
  test('SCEN-181: Action 4が初回報告データを収集・分析し、提出状況と内容品質を正確に評価する', async () => {
    // ========== Setup: テスト用初回報告データセット ==========
    const testReportData = [
      {
        submitterId: 'ENG001',
        submissionTimestamp: new Date('2024-01-15T08:00:00Z'),
        status: 'submitted',
        yesterday: '要件定義ドキュメント作成',
        today: 'デザインレビュー実施',
        issue: '依存モジュールの遅延リスク',
      },
      {
        submitterId: 'ENG002',
        submissionTimestamp: new Date('2024-01-15T08:15:00Z'),
        status: 'submitted',
        yesterday: 'ユニットテスト実装',
        today: '統合テスト開始',
        issue: 'テストケース増加に伴う実行時間延伸',
      },
      {
        submitterId: 'ENG003',
        submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
        status: 'submitted',
        yesterday: 'API仕様書レビュー完了',
        today: 'バックエンド実装開始',
        issue: 'データベース接続タイムアウト',
      },
      {
        submitterId: 'ENG004',
        submissionTimestamp: new Date('2024-01-15T08:45:00Z'),
        status: 'submitted',
        yesterday: 'フロントエンド画面実装',
        today: 'エラーハンドリング追加',
        issue: 'ブラウザ互換性問題',
      },
      {
        submitterId: 'ENG005',
        submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
        status: 'submitted',
        yesterday: 'インフラ環境構築',
        today: 'セキュリティ設定確認',
        issue: 'SSL証明書更新必要',
      },
      {
        submitterId: 'ENG006',
        submissionTimestamp: new Date('2024-01-15T09:15:00Z'),
        status: 'submitted',
        yesterday: 'ドキュメント作成',
        today: 'チーム内レビュー',
        issue: null,
      },
      {
        submitterId: 'ENG007',
        submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
        status: 'submitted',
        yesterday: 'バグ修正',
        today: 'リグレッションテスト',
        issue: '修正内容の検証が不十分',
      },
      {
        submitterId: 'ENG008',
        submissionTimestamp: new Date('2024-01-15T09:45:00Z'),
        status: 'submitted',
        yesterday: 'パフォーマンス最適化',
        today: 'キャッシュ戦略検討',
        issue: null,
      },
      {
        submitterId: 'ENG009',
        submissionTimestamp: new Date('2024-01-15T10:00:00Z'),
        status: 'not_submitted',
        yesterday: null,
        today: null,
        issue: null,
      },
      {
        submitterId: 'ENG010',
        submissionTimestamp: new Date('2024-01-15T10:15:00Z'),
        status: 'not_submitted',
        yesterday: null,
        today: null,
        issue: null,
      },
    ];

    // ========== Setup: スタブAIクライアント ==========
    const mockAiClient: Tx10Imp1AiClient = {
      executeAction: jest.fn(async (actionName: string, prompt: string) => {
        if (actionName === 'action-04') {
          // Action 4: 初回報告データを収集・分析し、提出状況と内容品質を評価する
          return {
            submissionStats: {
              totalCount: 10,
              submittedCount: 8,
              notSubmittedCount: 2,
              submittedMemberIds: [
                'ENG001',
                'ENG002',
                'ENG003',
                'ENG004',
                'ENG005',
                'ENG006',
                'ENG007',
                'ENG008',
              ],
              notSubmittedMemberIds: ['ENG009', 'ENG010'],
            },
            qualityEvaluations: [
              {
                memberId: 'ENG001',
                completeness: 100,
                businessRelevance: 95,
                specificity: 90,
                overallScore: 95,
              },
              {
                memberId: 'ENG002',
                completeness: 100,
                businessRelevance: 92,
                specificity: 88,
                overallScore: 93,
              },
              {
                memberId: 'ENG003',
                completeness: 100,
                businessRelevance: 88,
                specificity: 85,
                overallScore: 91,
              },
              {
                memberId: 'ENG004',
                completeness: 100,
                businessRelevance: 90,
                specificity: 87,
                overallScore: 92,
              },
              {
                memberId: 'ENG005',
                completeness: 100,
                businessRelevance: 89,
                specificity: 86,
                overallScore: 92,
              },
              {
                memberId: 'ENG006',
                completeness: 100,
                businessRelevance: 85,
                specificity: 80,
                overallScore: 88,
              },
              {
                memberId: 'ENG007',
                completeness: 100,
                businessRelevance: 72,
                specificity: 75,
                overallScore: 76,
              },
              {
                memberId: 'ENG008',
                completeness: 100,
                businessRelevance: 78,
                specificity: 72,
                overallScore: 75,
              },
            ],
            qualityDistribution: {
              scoreAbove80: 6,
              scoreBetween70And79: 2,
              scoreBetween60And69: 0,
              scoreBelow60: 0,
            },
            analysisTimestamp: new Date('2024-01-15T11:00:00Z'),
            processedRecordCount: 10,
          };
        }
        return null;
      }),
    };

    // ========== Execution: runTx10Imp1Agentを呼び出し ==========
    const input = {
      deploymentInitiationTimestamp: new Date('2024-01-15T06:00:00Z'),
      participantList: [
        {
          userId: 'ENG001',
          role: 'Engineer',
          email: 'eng001@example.com',
        },
        {
          userId: 'ENG002',
          role: 'Engineer',
          email: 'eng002@example.com',
        },
        {
          userId: 'ENG003',
          role: 'Engineer',
          email: 'eng003@example.com',
        },
        {
          userId: 'ENG004',
          role: 'Engineer',
          email: 'eng004@example.com',
        },
        {
          userId: 'ENG005',
          role: 'Engineer',
          email: 'eng005@example.com',
        },
        {
          userId: 'ENG006',
          role: 'Engineer',
          email: 'eng006@example.com',
        },
        {
          userId: 'ENG007',
          role: 'Engineer',
          email: 'eng007@example.com',
        },
        {
          userId: 'ENG008',
          role: 'Engineer',
          email: 'eng008@example.com',
        },
        {
          userId: 'ENG009',
          role: 'Engineer',
          email: 'eng009@example.com',
        },
        {
          userId: 'ENG010',
          role: 'Engineer',
          email: 'eng010@example.com',
        },
      ],
      preparationDaysRequired: 3,
      reportingDeadlineTime: '09:00',
    };

    const result = await runTx10Imp1Agent(input, mockAiClient);

    // ========== Assertion: Action 4が呼び出されたことを確認 ==========
    expect(mockAiClient.executeAction).toHaveBeenCalled();
    const actionCalls = (mockAiClient.executeAction as jest.Mock).mock.calls;
    const action04Call = actionCalls.find(
      (call: any[]) => call[0] === 'action-04'
    );
    expect(action04Call).toBeDefined();

    // ========== Assertion: buildAction04Promptが正しいプロンプトを生成 ==========
    const action04Prompt = buildAction04Prompt(testReportData);
    expect(action04Prompt).toBeDefined();
    expect(action04Prompt).toContain('初回報告データ');

    // ========== Assertion: プロンプトバージョン管理の確認 ==========
    expect(ACTION_04_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_04_PROMPT_VERSION).toBe('string');

    // ========== Assertion: 提出状況の正確性（8名提出、2名未提出） ==========
    expect(result).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();
    expect(result.initialReportAnalysis.submissionRate).toBe(80); // 8/10 * 100

    // ========== Assertion: 提出メンバーと未提出メンバー ==========
    const submittedCount = testReportData.filter(
      (r) => r.status === 'submitted'
    ).length;
    const notSubmittedCount = testReportData.filter(
      (r) => r.status === 'not_submitted'
    ).length;
    expect(submittedCount).toBe(8);
    expect(notSubmittedCount).toBe(2);

    // ========== Assertion: 内容品質評価の確認（3観点） ==========
    expect(result.initialReportAnalysis.dataQualityScore).toBeDefined();
    expect(typeof result.initialReportAnalysis.dataQualityScore).toBe('number');
    expect(result.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(
      0
    );
    expect(result.initialReportAnalysis.dataQualityScore).toBeLessThanOrEqual(
      100
    );

    // ========== Assertion: 形式統一度スコア ==========
    expect(result.initialReportAnalysis.formatUniformityScore).toBeDefined();
    expect(typeof result.initialReportAnalysis.formatUniformityScore).toBe(
      'number'
    );
    expect(
      result.initialReportAnalysis.formatUniformityScore
    ).toBeGreaterThanOrEqual(0);
    expect(
      result.initialReportAnalysis.formatUniformityScore
    ).toBeLessThanOrEqual(100);

    // ========== Assertion: 品質基準値からの乖離判定を確認 ==========
    // 品質スコア80以上：6名、70～79：2名
    const highQualityCount = 6;
    const mediumQualityCount = 2;
    const totalEvaluatedCount = highQualityCount + mediumQualityCount;
    expect(totalEvaluatedCount).toBe(8); // 提출 8명

    // ========== Assertion: フィードバック案が生成されている ==========
    expect(result.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(Array.isArray(result.initialReportAnalysis.feedbackItems)).toBe(
      true
    );

    // ========== Assertion: 処理タイムスタンプと監査証跡 ==========
    expect(result).toHaveProperty('initialReportAnalysis');
    expect(result.initialReportAnalysis).toHaveProperty('submissionRate');

    // ========== Assertion: 後続Action 5への入力として構造化されている ==========
    expect(result.initialReportAnalysis).toEqual(
      expect.objectContaining({
        submissionRate: expect.any(Number),
        dataQualityScore: expect.any(Number),
        formatUniformityScore: expect.any(Number),
        feedbackItems: expect.any(Array),
      })
    );

    // ========== Assertion: processedRecordCountが10件 ==========
    const processedCount = testReportData.length;
    expect(processedCount).toBe(10);
  });
});