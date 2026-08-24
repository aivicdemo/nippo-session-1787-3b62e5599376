import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-03';

describe('Tx1Imp1Agent - 日報集約から課題優先順位付けと未提出通知までの自律実行', () => {
  // SCEN-3082
  test('提出済み日報から課題を抽出・分類するAction 3が契約どおり実行される', async () => {
    // Arrange: フェイクAIクライアントを初期化
    const fakeAiClient = {
      callAction01: jest.fn(),
      callAction02: jest.fn(),
      callAction03: jest.fn(),
      callAction04: jest.fn(),
      callAction05: jest.fn(),
      callAction06: jest.fn(),
    };

    // 提出済み日報データセット(5件)を準備
    const submittedReportsDataset = [
      {
        reportId: 'report_001',
        userId: 'user_001',
        content: '昨日: DBバージョンアップを完了。今日: APIテスト実施予定。課題: データベース接続エラーが散発的に発生している',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
      {
        reportId: 'report_002',
        userId: 'user_002',
        content: '昨日: フロントエンド機能実装完了。今日: デプロイ準備。課題: ビルドエラーが頻発している',
        submittedAt: new Date('2024-01-15T08:32:00Z'),
      },
      {
        reportId: 'report_003',
        userId: 'user_003',
        content: '昨日: ドキュメント作成。今日: レビュー対応。課題: データベース接続エラーが再発',
        submittedAt: new Date('2024-01-15T08:33:00Z'),
      },
      {
        reportId: 'report_004',
        userId: 'user_004',
        content: '昨日: テスト設計完了。今日: テスト実施。課題: 顧客からのクレーム対応が必要',
        submittedAt: new Date('2024-01-15T08:34:00Z'),
      },
      {
        reportId: 'report_005',
        userId: 'user_005',
        content: '昨日: パフォーマンス改善。今日: 本番環境検証。課題: セキュリティ脆弱性が検出された',
        submittedAt: new Date('2024-01-15T08:35:00Z'),
      },
    ];

    // Action 3の期待レスポンス(抽出された課題オブジェクト配列)
    const action03ResponseExtractedIssues = [
      {
        issueId: 'issue_001',
        issueText: 'データベース接続エラーが散発的に発生している',
        category: 'インフラ',
        sourceReportId: 'report_001',
        extractedAt: new Date('2024-01-15T08:45:00Z').toISOString(),
      },
      {
        issueId: 'issue_002',
        issueText: 'ビルドエラーが頻発している',
        category: 'ビルド',
        sourceReportId: 'report_002',
        extractedAt: new Date('2024-01-15T08:45:00Z').toISOString(),
      },
      {
        issueId: 'issue_003',
        issueText: 'データベース接続エラーが再発',
        category: 'インフラ',
        sourceReportId: 'report_003',
        extractedAt: new Date('2024-01-15T08:45:00Z').toISOString(),
      },
      {
        issueId: 'issue_004',
        issueText: '顧客からのクレーム対応が必要',
        category: 'カスタマー',
        sourceReportId: 'report_004',
        extractedAt: new Date('2024-01-15T08:45:00Z').toISOString(),
      },
      {
        issueId: 'issue_005',
        issueText: 'セキュリティ脆弱性が検出された',
        category: 'セキュリティ',
        sourceReportId: 'report_005',
        extractedAt: new Date('2024-01-15T08:45:00Z').toISOString(),
      },
    ];

    // フェイクAIクライアントのAction 3モック: Action 3プロンプトを受け取り、抽出課題配列を返す
    fakeAiClient.callAction03.mockResolvedValue({
      extractedIssues: action03ResponseExtractedIssues,
    });

    // オーケストレータ引数を準備
    const orchestratorInput = {
      executionTimestamp: new Date('2024-01-15T08:00:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:30:00Z'),
      targetTeamIds: ['team_001'],
      managerUserId: 'manager_001',
    };

    // Act: runTx1Imp1Agent関数を実行
    const result = await runTx1Imp1Agent(orchestratorInput, fakeAiClient);

    // Assert: buildAction03Promptがプロンプトモジュールから正常にエクスポートされている
    expect(typeof buildAction03Prompt).toBe('function');
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');

    // Action 3がフェイクAIクライアントに呼ばれたことを確認
    expect(fakeAiClient.callAction03).toHaveBeenCalled();

    // fakeAiClient.callAction03に渡されたプロンプト引数を確認
    const action03CallArgs = fakeAiClient.callAction03.mock.calls[0];
    expect(action03CallArgs).toBeDefined();
    
    const action03PromptArg = action03CallArgs[0];
    expect(typeof action03PromptArg).toBe('string');
    // プロンプトが日報テキスト、課題抽出ルール、分類カテゴリ定義を含むことを確認
    expect(action03PromptArg).toMatch(/課題/);

    // 戻り値にAction 3から返された課題オブジェクト配列が保持されていることを確認
    expect(result).toBeDefined();
    expect(result.prioritizedIssuesList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);

    // 抽出された課題データが後続処理へ契約通り引き継がれていることを検証
    expect(result.prioritizedIssuesList.length).toBeGreaterThan(0);
    
    // 各課題オブジェクトが必須属性を含むことを確認
    result.prioritizedIssuesList.forEach((issue: any) => {
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueId).toBe('string');
      expect(issue.issueText).toBeDefined();
      expect(typeof issue.issueText).toBe('string');
      expect(issue.category).toBeDefined();
      expect(typeof issue.category).toBe('string');
      expect(issue.sourceReportId).toBeDefined();
      expect(typeof issue.sourceReportId).toBe('string');
      expect(issue.extractedAt).toBeDefined();
      expect(typeof issue.extractedAt).toBe('string');
    });

    // 抽出された課題がAction 3レスポンスと整合していることを確認
    const extractedIssueIds = result.prioritizedIssuesList.map((issue: any) => issue.issueId);
    const expectedIssueIds = action03ResponseExtractedIssues.map(issue => issue.issueId);
    expect(extractedIssueIds).toEqual(expectedIssueIds);

    // 実行ステータスが成功または部分成功であることを確認
    expect(['success', 'partial_failure']).toContain(result.executionStatus);

    // 朝会資料URLまたはメール送信完了フラグが存在することを確認
    expect(result.morningMeetingMaterialUrl).toBeDefined();
    expect(typeof result.morningMeetingMaterialUrl).toBe('string');

    // 実行完了時刻が記録されていることを確認
    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp instanceof Date).toBe(true);
  });
});