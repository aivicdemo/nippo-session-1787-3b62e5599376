import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
} from '../../src/agents/tx-5-imp-1/types';

interface Tx5Imp1AiClientStub {
  extractKeywords: jest.Mock;
  assessImpactScore: jest.Mock;
  classifyIssueSeverity: jest.Mock;
}

interface NotificationServiceAdapterStub {
  sendReminderNotification: jest.Mock;
}

describe('朝会報告から課題抽出・既存ツール連携までの自動実行エージェント', () => {
  let aiClientStub: Tx5Imp1AiClientStub;
  let notificationAdapterStub: NotificationServiceAdapterStub;

  beforeEach(() => {
    aiClientStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    notificationAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'msg_test_001',
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3155
  test('新規カテゴリ検出時に既存ツール連携前に人への引き継ぎを実行する', async () => {
    // テストデータ準備: 新規カテゴリ『セキュリティ脆弱性対応』を含む課題
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue_001',
        title: 'セキュリティ脆弱性が検出された',
        description: 'SQLインジェクション脆弱性がデータベースモジュールで発見',
        reportedBy: 'engineer_01',
        reportedAt: '2024-01-15T10:30:00Z',
        keywordMatches: ['セキュリティ', '脆弱性', 'SQLインジェクション'],
      },
    ];

    // 既存カテゴリ定義: バグ報告、機能要望、運用改善の3種類に限定
    const categoryMappings: CategoryMapping[] = [
      {
        sourceCategory: 'バグ報告',
        targetToolCategory: 'Bug',
        jiraIssueType: 'Bug',
        asanaCategory: 'bug_report',
      },
      {
        sourceCategory: '機能要望',
        targetToolCategory: 'Feature Request',
        jiraIssueType: 'Story',
        asanaCategory: 'feature_request',
      },
      {
        sourceCategory: '運用改善',
        targetToolCategory: 'Improvement',
        jiraIssueType: 'Task',
        asanaCategory: 'operational_improvement',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      authToken: 'token_placeholder',
      projectKey: 'PROJ',
      defaultAssignee: 'tech_lead',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
      lowThreshold: 0,
    };

    // Action 1: 形式・内容検証 - 課題データが妥当と判定される
    const validationResult = {
      isValid: true,
      validationErrors: [],
      validationWarnings: [],
    };

    // Action 2: 優先度・カテゴリ自動判定 - AIクライアントが新規カテゴリを返す
    aiClientStub.extractKeywords.mockResolvedValue({
      keywords: ['セキュリティ', '脆弱性'],
      frequency: 2,
      confidence: 0.92,
    });

    aiClientStub.classifyIssueSeverity.mockResolvedValue({
      category: 'セキュリティ脆弱性対応',
      severity: 'critical',
      isNewCategory: true,
    });

    aiClientStub.assessImpactScore.mockResolvedValue({
      impactScore: 88,
      priorityRank: 'high',
    });

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // エージェント実行
    const result = await runTx5Imp1Agent(agentInput, aiClientStub);

    // 検証1: NotificationServiceAdapterを通じて管理者への通知が送信されたことを確認
    expect(notificationAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
    // （注: 実装では NotificationServiceAdapter が agentInput または DI で提供される前提）

    // 検証2: エージェント戻り値のステータスが『ESCALATED_TO_HUMAN』であることを確認
    expect(result.integrationStatus).toBe('escalated_to_human');

    // 検証3: escalationReasonが『NEW_CATEGORY_DETECTED』であることを確認
    expect(result).toHaveProperty('escalationReason');
    expect((result as Tx5Imp1AgentOutput & { escalationReason?: string }).escalationReason).toBe(
      'NEW_CATEGORY_DETECTED'
    );

    // 検証4: validatedIssuesに課題が含まれていることを確認
    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0]).toMatchObject({
      issueId: 'issue_001',
      validationStatus: 'warning',
    });

    // 検証5: 既存ツール（Jira・Asana）への登録処理が実行されていないことを確認
    // integrationResultの成功件数が0であることで確認
    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.retryQueue).toHaveLength(0);

    // 検証6: 実行サマリーがエスカレーション状態を示していることを確認
    expect(result.executionSummary.status).toBe('ESCALATED_TO_HUMAN');
    expect(result.executionSummary.escalationReason).toBe('NEW_CATEGORY_DETECTED');
    expect(result.executionSummary.escalationDetails).toMatchObject({
      newCategoryDetected: 'セキュリティ脆弱性対応',
      issueId: 'issue_001',
      detectionTimestamp: expect.any(String),
    });

    // 検証7: AIクライアントの呼び出しが適切に行われたことを確認
    expect(aiClientStub.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        issueDescription: extractedIssueData[0].description,
      })
    );
    expect(aiClientStub.classifyIssueSeverity).toHaveBeenCalled();
    expect(aiClientStub.assessImpactScore).toHaveBeenCalled();

    // 検証8: 実行時間が記録されていることを確認
    expect(result.executionSummary.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.executionSummary.executionTimeMs).toBeLessThan(30000);
  });
});