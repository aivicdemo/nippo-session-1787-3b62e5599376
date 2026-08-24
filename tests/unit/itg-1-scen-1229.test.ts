import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 既存ツール連携 - 課題検証から連携完了まで', () => {
  test('SCEN-1229: 報告登録時にタイムスタンプが null のとき処理が中断される', async () => {
    // 入力: 抽出済み課題データ（タイムスタンプが null）
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'データベース接続エラー',
        description: 'Production環境でDB接続がタイムアウトしている',
        reportedBy: 'engineer-001',
        reportedAt: null, // タイムスタンプが null に設定
        frequency: 2,
        impactScope: 'critical',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'TEST',
      apiToken: 'test-token',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'technical',
        toolCategory: 'Technical Issue',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // モック AI クライアント（検証と連携を担当）
    const mockAiClient = {
      validateExtractedIssues: jest
        .fn()
        .mockRejectedValue(
          new Error('タイムスタンプが記録されていません')
        ),
      determinePriorityAndCategory: jest.fn(),
      executeToolIntegration: jest.fn(),
      generateConfirmationEmail: jest.fn(),
      handleIntegrationError: jest.fn(),
    };

    // 実行
    const result = await runTx5Imp1Agent(input, mockAiClient);

    // 期待値: 処理が中断され、エラーステータスが返される
    expect(result.integrationStatus).toBe('retry_scheduled');
    expect(result.validationResult.passedCount).toBe(0);
    expect(result.validationResult.failedCount).toBeGreaterThanOrEqual(1);
    expect(result.confirmationEmailSent).toBe(false);

    // エラーメッセージが含まれていること
    const failedIssue = result.validationResult.issues.find(
      (issue) => issue.validationStatus === 'invalid'
    );
    expect(failedIssue).toBeDefined();
    expect(failedIssue?.reason).toMatch(/タイムスタンプ/);

    // validateExtractedIssues が呼ばれていること
    expect(mockAiClient.validateExtractedIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssueData: expect.arrayContaining([
          expect.objectContaining({
            issueId: 'issue-001',
            reportedAt: null,
          }),
        ]),
      })
    );

    // 確認メールが送信されていないこと
    expect(mockAiClient.generateConfirmationEmail).not.toHaveBeenCalled();
  });
});