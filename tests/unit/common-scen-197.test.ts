import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-11-imp-1/prompts/action-03';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('日報収集・確認・催促の自動化エージェント - Action 3 課題自動抽出', () => {
  // SCEN-197
  test('AIエージェントが提出日報から課題を自動抽出し、audit eventログに記録される', async () => {
    // テスト用の日報データセット準備
    const submittedReports = [
      {
        reportId: 'RPT-001',
        memberId: 'MEM-001',
        submittedAt: '2024-01-15T09:00:00Z',
        yesterday: '機能A の実装を完了',
        today: '機能B の設計開始',
        challenges: '機能B の要件定義が不明確である',
      },
      {
        reportId: 'RPT-002',
        memberId: 'MEM-002',
        submittedAt: '2024-01-15T09:15:00Z',
        yesterday: 'テスト実行完了',
        today: 'バグ修正開始',
        challenges: 'パフォーマンス低下の原因特定が困難 / テストカバレッジが不足',
      },
      {
        reportId: 'RPT-003',
        memberId: 'MEM-003',
        submittedAt: '2024-01-15T09:30:00Z',
        yesterday: 'ドキュメント作成',
        today: 'レビュー対応',
        challenges: 'デプロイ手順の複雑さ',
      },
      {
        reportId: 'RPT-004',
        memberId: 'MEM-004',
        submittedAt: '2024-01-15T09:45:00Z',
        yesterday: 'インフラ構築',
        today: 'セキュリティ監査',
        challenges: 'ログローテーション設定に問題あり / スケーリング対応が必要',
      },
      {
        reportId: 'RPT-005',
        memberId: 'MEM-005',
        submittedAt: '2024-01-15T10:00:00Z',
        yesterday: 'コード審査完了',
        today: 'マージ・デプロイ',
        challenges: 'リリースタイミングの調整',
      },
    ];

    // 各日報の3項目確認
    submittedReports.forEach((report) => {
      expect(report.yesterday).toBeDefined();
      expect(report.today).toBeDefined();
      expect(report.challenges).toBeDefined();
      expect(typeof report.yesterday).toBe('string');
      expect(typeof report.today).toBe('string');
      expect(typeof report.challenges).toBe('string');
    });

    // Action 3 プロンプトモジュールの検証
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction03Prompt).toBe('function');

    // プロンプト生成の検証
    const generatedPrompt = buildAction03Prompt(submittedReports);
    expect(generatedPrompt).toBeDefined();
    expect(typeof generatedPrompt).toBe('string');
    expect(generatedPrompt.length).toBeGreaterThan(0);

    // Fake AI Client の構築
    const fakeAiClient: Tx11Imp1AiClient = {
      callAction03ExtractChallenges: jest.fn().mockResolvedValue({
        extractedChallenges: [
          {
            challengeId: 'CHG-001',
            text: '機能B の要件定義が不明確である',
            sourceReportId: 'RPT-001',
          },
          {
            challengeId: 'CHG-002',
            text: 'パフォーマンス低下の原因特定が困難',
            sourceReportId: 'RPT-002',
          },
          {
            challengeId: 'CHG-003',
            text: 'テストカバレッジが不足',
            sourceReportId: 'RPT-002',
          },
          {
            challengeId: 'CHG-004',
            text: 'デプロイ手順の複雑さ',
            sourceReportId: 'RPT-003',
          },
          {
            challengeId: 'CHG-005',
            text: 'ログローテーション設定に問題あり',
            sourceReportId: 'RPT-004',
          },
          {
            challengeId: 'CHG-006',
            text: 'スケーリング対応が必要',
            sourceReportId: 'RPT-004',
          },
          {
            challengeId: 'CHG-007',
            text: 'リリースタイミングの調整',
            sourceReportId: 'RPT-005',
          },
          {
            challengeId: 'CHG-008',
            text: 'セキュリティ設定の検証不足',
            sourceReportId: 'RPT-004',
          },
        ],
      }),
    };

    // Audit event ログの集計用配列
    const auditEvents: Array<{
      action: string;
      timestamp: string;
      targetReportCount?: number;
      extractedChallengeCount?: number;
      executor: string;
    }> = [];

    // detectAndNotifyUnsubmitted 関数の実行
    const result = await detectAndNotifyUnsubmitted(submittedReports, {
      aiClient: fakeAiClient,
      onAuditEvent: (event) => {
        auditEvents.push(event);
      },
    });

    // 抽出結果の検証: 5件の提出日報から8個の個別課題が抽出
    expect(result.extractedChallenges).toBeDefined();
    expect(result.extractedChallenges.length).toBe(8);

    // 各課題の抽出元日報IDと課題テキストの正確性確認
    const challengesByReportId = result.extractedChallenges.reduce(
      (acc, challenge) => {
        if (!acc[challenge.sourceReportId]) {
          acc[challenge.sourceReportId] = [];
        }
        acc[challenge.sourceReportId].push(challenge);
        return acc;
      },
      {} as Record<string, typeof result.extractedChallenges>
    );

    // 日報ごとの課題数検証
    expect(challengesByReportId['RPT-001'].length).toBe(1);
    expect(challengesByReportId['RPT-002'].length).toBe(2);
    expect(challengesByReportId['RPT-003'].length).toBe(1);
    expect(challengesByReportId['RPT-004'].length).toBe(3);
    expect(challengesByReportId['RPT-005'].length).toBe(1);

    // 課題テキストと抽出元日報IDの正確性確認
    expect(result.extractedChallenges[0].text).toBe('機能B の要件定義が不明確である');
    expect(result.extractedChallenges[0].sourceReportId).toBe('RPT-001');
    expect(result.extractedChallenges[1].text).toBe('パフォーマンス低下の原因特定が困難');
    expect(result.extractedChallenges[1].sourceReportId).toBe('RPT-002');
    expect(result.extractedChallenges[2].text).toBe('テストカバレッジが不足');
    expect(result.extractedChallenges[2].sourceReportId).toBe('RPT-002');

    // ページネーション・重複の確認
    const uniqueChallengeIds = new Set(
      result.extractedChallenges.map((c) => c.challengeId)
    );
    expect(uniqueChallengeIds.size).toBe(8);

    // Audit event ログの検証
    const action03Event = auditEvents.find(
      (e) => e.action === 'Action 3: 課題自動抽出実行'
    );
    expect(action03Event).toBeDefined();
    expect(action03Event?.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(action03Event?.targetReportCount).toBe(5);
    expect(action03Event?.extractedChallengeCount).toBe(8);
    expect(action03Event?.executor).toBe('AIエージェント');

    // runTx11Imp1Agent の実行と第2パラメータの構造検証
    const agentResult = await runTx11Imp1Agent(submittedReports, fakeAiClient);
    expect(agentResult).toBeDefined();
    expect(agentResult.challenges).toBeDefined();
    expect(agentResult.challenges.length).toBe(8);
  });
});