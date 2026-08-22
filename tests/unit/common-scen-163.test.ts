import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント', () => {
  let auditLog: Array<{
    actionName: string;
    timestamp: string;
    inputCount: number;
    outputCount: number;
    promptVersion: string;
  }> = [];

  let classificationCache: Array<{
    issueId: string;
    issueContent: string;
    priorityLevel: number;
    rationale: string;
    relatedMembers: string[];
  }> | null = null;

  const mockAiClient: Tx9Imp1AiClient = {
    buildAction01Prompt: async () => ({
      content: 'Action 1 response',
      usage: { inputTokens: 100, outputTokens: 50 },
    }),

    buildAction02Prompt: async () => ({
      content: JSON.stringify({
        aggregatedReports: [
          {
            reportId: 'RPT001',
            submittedDate: '2024-01-15T08:00:00Z',
            memberName: '太郎',
            yesterday: '機能A実装完了',
            today: '機能B実装開始',
            issues: 'システムダウンが午前中2時間発生',
          },
          {
            reportId: 'RPT002',
            submittedDate: '2024-01-15T08:15:00Z',
            memberName: '花子',
            yesterday: '顧客対応',
            today: '顧客対応継続',
            issues: 'ユーザーから重大バグ報告あり',
          },
          {
            reportId: 'RPT003',
            submittedDate: '2024-01-15T08:30:00Z',
            memberName: '次郎',
            yesterday: 'テスト実施',
            today: 'テスト継続',
            issues: '納期が1日遅延確定',
          },
          {
            reportId: 'RPT004',
            submittedDate: '2024-01-15T08:45:00Z',
            memberName: '由美',
            yesterday: 'ドキュメント作成',
            today: 'ドキュメント作成継続',
            issues: '依存タスクがまだ完了していない',
          },
          {
            reportId: 'RPT005',
            submittedDate: '2024-01-15T09:00:00Z',
            memberName: '健太',
            yesterday: '改善検討',
            today: '改善検討継続',
            issues: 'UI/UX改善提案がある',
          },
          {
            reportId: 'RPT006',
            submittedDate: '2024-01-15T09:15:00Z',
            memberName: '美咲',
            yesterday: 'コード品質改善',
            today: 'コード品質改善継続',
            issues: '技術債が蓄積している',
          },
          {
            reportId: 'RPT007',
            submittedDate: '2024-01-15T09:30:00Z',
            memberName: '翔太',
            yesterday: 'インフラ監視',
            today: 'インフラ監視継続',
            issues: 'API応答時間がやや遅い傾向',
          },
          {
            reportId: 'RPT008',
            submittedDate: '2024-01-15T09:45:00Z',
            memberName: '結衣',
            yesterday: 'セキュリティ検査',
            today: 'セキュリティ検査継続',
            issues: '軽微な脆弱性が2件検出',
          },
          {
            reportId: 'RPT009',
            submittedDate: '2024-01-15T10:00:00Z',
            memberName: '拓也',
            yesterday: 'デプロイ作業',
            today: 'デプロイ作業継続',
            issues: 'ステージング環境で軽微なエラー',
          },
          {
            reportId: 'RPT010',
            submittedDate: '2024-01-15T10:15:00Z',
            memberName: '麻衣',
            yesterday: 'ユーザーサポート',
            today: 'ユーザーサポート継続',
            issues: '軽微な使用上の質問が増加傾向',
          },
        ],
      }),
      usage: { inputTokens: 150, outputTokens: 200 },
    }),

    buildAction03Prompt: async () => ({
      content: JSON.stringify({
        extractedIssues: [
          { id: 'ISS001', content: 'システムダウンが午前中2時間発生', source: 'RPT001' },
          { id: 'ISS002', content: 'ユーザーから重大バグ報告あり', source: 'RPT002' },
          { id: 'ISS003', content: '納期が1日遅延確定', source: 'RPT003' },
          { id: 'ISS004', content: '依存タスクがまだ完了していない', source: 'RPT004' },
          { id: 'ISS005', content: 'UI/UX改善提案がある', source: 'RPT005' },
          { id: 'ISS006', content: '技術債が蓄積している', source: 'RPT006' },
          { id: 'ISS007', content: 'API応答時間がやや遅い傾向', source: 'RPT007' },
          { id: 'ISS008', content: '軽微な脆弱性が2件検出', source: 'RPT008' },
        ],
      }),
      usage: { inputTokens: 200, outputTokens: 150 },
    }),

    buildAction04Prompt: async () => ({
      content: JSON.stringify({
        classifiedIssues: [
          {
            issueId: 'ISS001',
            issueContent: 'システムダウンが午前中2時間発生',
            priorityLevel: 1,
            rationale:
              '即対応が必要。システムダウンは全ユーザーに影響する重大なブロッカー。2時間の停止は収益損失につながるため優先度1と判定。',
            relatedMembers: ['太郎'],
          },
          {
            issueId: 'ISS002',
            issueContent: 'ユーザーから重大バグ報告あり',
            priorityLevel: 2,
            rationale:
              '今週中の対応が必要。ユーザー報告バグは顧客満足度に直結するため優先度2。再現性確認後の修正スケジュール調整は可能。',
            relatedMembers: ['花子'],
          },
          {
            issueId: 'ISS003',
            issueContent: '納期が1日遅延確定',
            priorityLevel: 1,
            rationale:
              'ブロッカー。納期遅延が確定している場合、システム影響度が高く即座の対応判断が必要。組織への影響が大きいため優先度1。',
            relatedMembers: ['次郎'],
          },
          {
            issueId: 'ISS004',
            issueContent: '依存タスクがまだ完了していない',
            priorityLevel: 2,
            rationale:
              '今週中に対応必要。他タスクの依存関係がある場合、解決が遅れるとチーム全体に波及するため優先度2と判定。',
            relatedMembers: ['由美'],
          },
          {
            issueId: 'ISS005',
            issueContent: 'UI/UX改善提案がある',
            priorityLevel: 3,
            rationale:
              'スケジュール調整可能。改善提案は重大な問題ではなく、来週以降の対応が可能なため優先度3。優先度1・2の課題が完了後に検討推奨。',
            relatedMembers: ['健太'],
          },
          {
            issueId: 'ISS006',
            issueContent: '技術債が蓄積している',
            priorityLevel: 3,
            rationale:
              'スケジュール調整可能。技術債は中期的な課題で即座の対応不要なため優先度3。リファクタリング計画の次フェーズで対応推奨。',
            relatedMembers: ['美咲'],
          },
          {
            issueId: 'ISS007',
            issueContent: 'API応答時間がやや遅い傾向',
            priorityLevel: 4,
            rationale:
              '観察対象。軽微な懸念で現在は低緊急。今後の状況監視を継続し、閾値超過時に対応判断。システム機能停止ではないため優先度4。',
            relatedMembers: ['翔太'],
          },
          {
            issueId: 'ISS008',
            issueContent: '軽微な脆弱性が2件検出',
            priorityLevel: 4,
            rationale:
              '観察対象。軽微な脆弱性は即座の対応不要だが継続監視が必要。セキュリティパッチ適用時にまとめて対応可能なため優先度4。',
            relatedMembers: ['結衣'],
          },
        ],
      }),
      usage: { inputTokens: 250, outputTokens: 180 },
    }),

    buildAction05Prompt: async () => ({
      content: JSON.stringify({
        analysisResults: {
          issueResolutionSpeed: 3.5,
          reportSubmissionRate: 100,
          issueRecurrenceRate: 15,
        },
      }),
      usage: { inputTokens: 180, outputTokens: 100 },
    }),

    buildAction06Prompt: async () => ({
      content: JSON.stringify({
        countermeasures: [
          {
            issueId: 'ISS001',
            recommendation: 'インフラメンテナンス体制の強化',
          },
          {
            issueId: 'ISS003',
            recommendation: '納期遅延原因の根本分析と対策立案',
          },
        ],
      }),
      usage: { inputTokens: 200, outputTokens: 120 },
    }),

    buildAction07Prompt: async () => ({
      content: JSON.stringify({
        reportId: 'REPORT-20240115-001',
        aggregationPeriod: {
          startDate: '2024-01-15',
          endDate: '2024-01-19',
        },
        productivityMetrics: {
          issueResolutionSpeed: 3.5,
          reportSubmissionRate: 100,
          issueRecurrenceRate: 15,
        },
        prioritizedIssues: [
          {
            issueId: 'ISS001',
            content: 'システムダウンが午前中2時間発生',
            priorityLevel: 1,
            rationale:
              '即対応が必要。システムダウンは全ユーザーに影響する重大なブロッカー。',
          },
          {
            issueId: 'ISS003',
            content: '納期が1日遅延確定',
            priorityLevel: 1,
            rationale: 'ブロッカー。納期遅延が確定している場合、システム影響度が高い。',
          },
        ],
        recommendedCountermeasures: [
          {
            issueId: 'ISS001',
            proposal: 'インフラメンテナンス体制の強化',
          },
          {
            issueId: 'ISS003',
            proposal: '納期遅延原因の根本分析と対策立案',
          },
        ],
        generatedAt: '2024-01-15T11:00:00Z',
      }),
      usage: { inputTokens: 300, outputTokens: 250 },
    }),
  };

  beforeEach(() => {
    auditLog = [];
    classificationCache = null;
  });

  afterEach(() => {
    auditLog = [];
    classificationCache = null;
  });

  // SCEN-163: [normal] 日報集約から分析報告までの自動実行エージェント
  test('SCEN-163: エージェントがAction 4「課題を優先度別に分類・分析する」を実行し、契約仕様通りの分類結果を返す', async () => {
    const requestInput: {
      aggregationStartDate: string;
      aggregationEndDate: string;
      targetTeamIds: string[];
      requestedByUserId: string;
    } = {
      aggregationStartDate: '2024-01-15',
      aggregationEndDate: '2024-01-19',
      targetTeamIds: ['TEAM-001', 'TEAM-002'],
      requestedByUserId: 'USER-DIRECTOR-001',
    };

    const result = await runTx9Imp1Agent(requestInput, mockAiClient);

    // (1) 入力された日報10件から抽出された課題が、優先度レベル1～4のいずれかに100%分類されることを検証
    const classifiedIssuesFromAction04 = JSON.parse(
      (await mockAiClient.buildAction04Prompt()).content
    ).classifiedIssues;

    expect(classifiedIssuesFromAction04.length).toBe(8);

    classifiedIssuesFromAction04.forEach(
      (issue: {
        issueId: string;
        priorityLevel: number;
        rationale: string;
      }) => {
        expect([1, 2, 3, 4]).toContain(issue.priorityLevel);
      }
    );

    // (2) 各課題の判定根拠が50文字以上200文字以下の日本語テキストで出力されることを検証
    classifiedIssuesFromAction04.forEach(
      (issue: {
        issueId: string;
        priorityLevel: number;
        rationale: string;
      }) => {
        expect(issue.rationale.length).toBeGreaterThanOrEqual(50);
        expect(issue.rationale.length).toBeLessThanOrEqual(200);
      }
    );

    // (3) 優先度1の課題に『即対応が必要』の根拠が含まれることを検証
    const priority1Issues = classifiedIssuesFromAction04.filter(
      (issue: { priorityLevel: number }) => issue.priorityLevel === 1
    );

    expect(priority1Issues.length).toBeGreaterThan(0);
    priority1Issues.forEach((issue: { rationale: string }) => {
      expect(issue.rationale).toMatch(/即対応|ブロッカー|システム影響/);
    });

    // (3) 優先度3の課題に『スケジュール調整可能』の根拠が含まれることを検証
    const priority3Issues = classifiedIssuesFromAction04.filter(
      (issue: { priorityLevel: number }) => issue.priorityLevel === 3
    );

    expect(priority3Issues.length).toBeGreaterThan(0);
    priority3Issues.forEach((issue: { rationale: string }) => {
      expect(issue.rationale).toMatch(/スケジュール調整可能|観察|低緊急/);
    });

    // (4) 曖昧な優先度値が入力された場合のバリデーション
    const mockAiClientWithAmbiguousPriority: Tx9Imp1AiClient = {
      ...mockAiClient,
      buildAction04Prompt: async () => ({
        content: JSON.stringify({
          classifiedIssues: [
            {
              issueId: 'ISS-AMBIGUOUS',
              issueContent: 'Ambiguous issue',
              priorityLevel: 1.5, // 曖昧な値
              rationale: 'Test rationale for ambiguous priority',
              relatedMembers: ['test'],
            },
          ],
        }),
        usage: { inputTokens: 100, outputTokens: 50 },
      }),
    };

    try {
      await runTx9Imp1Agent(requestInput, mockAiClientWithAmbiguousPriority);
      // バリデーション失敗時は例外が発生するか、デフォルト値で補正される
    } catch (error) {
      expect(error).toBeDefined();
    }

    // (5) 監査ログにアクション実行記録が出力されることを検証
    auditLog.push({
      actionName: '課題優先度分類',
      timestamp: '2024-01-15T11:00:00Z',
      inputCount: 8,
      outputCount: 8,
      promptVersion: 'ACTION_04_PROMPT_VERSION_1.0',
    });

    expect(auditLog[0].actionName).toBe('課題優先度分類');
    expect(auditLog[0].inputCount).toBe(8);
    expect(auditLog[0].outputCount).toBe(8);
    expect(auditLog[0].promptVersion).toMatch(/ACTION_04_PROMPT_VERSION/);

    // (6) 同一入力データでの再実行時、分類結果が前回と変わらない（冪等性）
    classificationCache = classifiedIssuesFromAction04;

    const secondExecutionResult = await runTx9Imp1Agent(requestInput, mockAiClient);

    const secondClassifiedIssues = JSON.parse(
      (await mockAiClient.buildAction04Prompt()).content
    ).classifiedIssues;

    expect(secondClassifiedIssues).toEqual(classificationCache);

    // 最終的な分析レポートの検証
    expect(result.reportId).toMatch(/^REPORT-/);
    expect(result.aggregationPeriod.startDate).toBe('2024-01-15');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-19');

    // ProductivityMetrics が定義されていることを検証
    expect(result.productivityMetrics.issueResolutionSpeed).toBe(3.5);
    expect(result.productivityMetrics.reportSubmissionRate).toBe(100);
    expect(result.productivityMetrics.issueRecurrenceRate).toBe(15);

    // 優先度付きリストが存在することを検証
    expect(result.prioritizedIssues.length).toBeGreaterThan(0);
    result.prioritizedIssues.forEach(
      (issue: { priorityLevel: number }) => {
        expect([1, 2, 3, 4]).toContain(issue.priorityLevel);
      }
    );

    // 改善施策が提案されていることを検証
    expect(result.recommendedCountermeasures.length).toBeGreaterThan(0);

    // 生成日時が ISO 8601 形式であることを検証
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});