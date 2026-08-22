import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ValidatedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/types';

describe('Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-092
  it('should automatically judge priority and category for extracted issue and verify confidence score and email content', async () => {
    // テストデータ準備
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        issueText: 'サーバー応答遅延が発生',
        reportedDate: '2024-01-15T08:00:00Z',
        reporterId: 'user-001',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiBaseUrl: 'https://jira.example.com/rest/api/3',
      apiToken: 'fake-token',
      projectKey: 'TEST',
    };

    const priorityRules: PriorityRuleSet = {
      highImpactKeywords: ['遅延', 'エラー', 'クラッシュ'],
      mediumImpactKeywords: ['遅い', '不安定'],
      lowImpactKeywords: ['情報', '確認'],
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        keyword: '応答',
        category: 'インフラ',
        toolCategory: 'Infrastructure',
      },
      {
        keyword: 'サーバー',
        category: 'インフラ',
        toolCategory: 'Infrastructure',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // fake AI client の実装
    const fakeAiClient = {
      action01_validateIssueData: jest
        .fn()
        .mockResolvedValue({
          isValid: true,
          validationErrors: [],
        }),

      action02_judgePriorityAndCategory: jest.fn().mockResolvedValue({
        issueId: 'ISSUE-001',
        priorityScore: 88,
        priorityRank: 'high',
        category: 'インフラ',
        confidenceScore: 0.88,
        reasoning: 'キーワード「応答遅延」から優先度High、カテゴリインフラと判定',
      }),

      action03_checkToolIntegrationCompatibility: jest
        .fn()
        .mockResolvedValue({
          isCompatible: true,
          mappedToolCategory: 'Infrastructure',
          toolIssueDraft: {
            summary: 'サーバー応答遅延が発生',
            description: 'Issue ISSUE-001',
            issueType: 'Bug',
          },
        }),

      action04_generateConfirmationEmail: jest.fn().mockResolvedValue({
        recipientEmail: 'manager@example.com',
        subject: '【朝会報告】課題抽出・判定結果確認メール',
        body: `
課題ID: ISSUE-001
課題テキスト: サーバー応答遅延が発生
【優先度】High
【カテゴリ】インフラ
【信頼度スコア】0.88
        `.trim(),
      }),

      action05_recordExecutionSummary: jest.fn().mockResolvedValue({
        executionStartTime: '2024-01-15T08:30:00Z',
        executionEndTime: '2024-01-15T08:32:30Z',
        processedIssueCount: 1,
        successCount: 1,
        failureCount: 0,
        status: 'completed',
      }),
    };

    // メール送信APIをモック
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
      status: 200,
    });

    // runTx5Imp1Agent を実行
    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      input,
      fakeAiClient as any
    );

    // 検証1: Action 2が呼び出された
    expect(fakeAiClient.action02_judgePriorityAndCategory).toHaveBeenCalled();

    // 検証2: 判定結果の信頼度スコアが0.88であること
    expect(output.validatedIssues).toHaveLength(1);
    const validatedIssue: ValidatedIssue = output.validatedIssues[0];
    expect(validatedIssue.issueId).toBe('ISSUE-001');
    expect(validatedIssue.priorityRank).toBe('high');
    expect(validatedIssue.category).toBe('インフラ');
    expect(validatedIssue.priorityScore).toBe(88);

    // 検証3: 信頼度スコアが0.85以上であること
    expect(
      fakeAiClient.action02_judgePriorityAndCategory.mock.results[0].value
        .confidenceScore
    ).toBeGreaterThanOrEqual(0.85);

    // 検証4: 確認メール送信に優先度・カテゴリ情報が含まれていること
    expect(fakeAiClient.action04_generateConfirmationEmail).toHaveBeenCalled();
    const emailContent =
      fakeAiClient.action04_generateConfirmationEmail.mock.results[0].value
        .body;
    expect(emailContent).toMatch(/【優先度】High/);
    expect(emailContent).toMatch(/【カテゴリ】インフラ/);

    // 検証5: 実行サマリーが正常に記録されていること
    expect(output.executionSummary.status).toBe('completed');
    expect(output.executionSummary.successCount).toBe(1);
    expect(output.executionSummary.failureCount).toBe(0);

    // 検証6: 既存ツール連携情報が結果に含まれることを確認
    expect(output.integrationResult).toBeDefined();

    // 検証7: validationStatusが設定されていることを確認
    expect(validatedIssue.validationStatus).toBe('valid');
  });
});