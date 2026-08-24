import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-3-imp-1/prompts/action-02';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1: 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  test('SCEN-3115: Action 2が集約済み日報の課題を事前定義カテゴリに正確に分類する', async () => {
    const aggregatedReportIds = ['report-001', 'report-002', 'report-003'];
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';
    const managerUserId = 'user-manager-001';
    const priorityThresholdScore = 70;

    const mockIssueCategory = {
      category: '品質問題',
      categoryCode: 'QA-001',
      rationale: 'システムAの本番バグによる営業への影響'
    };

    const mockAiClient: Tx3Imp1AiClient = {
      callAction01: jest.fn(async () => ({
        extractedKeywords: [
          { keyword: 'システムAバグ', frequency: 3, confidence: 0.95 },
          { keyword: '営業問い合わせ増加', frequency: 2, confidence: 0.88 },
          { keyword: '本番環境不具合', frequency: 2, confidence: 0.92 }
        ]
      })),
      callAction02: jest.fn(async (prompt: string) => {
        expect(prompt).toContain('カテゴリに分類');
        return {
          classifications: [
            {
              keyword: 'システムAバグ',
              ...mockIssueCategory
            },
            {
              keyword: '営業問い合わせ増加',
              category: 'リスク',
              categoryCode: 'RISK-002',
              rationale: '顧客満足度低下のリスク'
            },
            {
              keyword: '本番環境不具合',
              category: '品質問題',
              categoryCode: 'QA-001',
              rationale: '本番環境の不具合報告'
            }
          ]
        };
      }),
      callAction03: jest.fn(async () => ({
        priorityScores: [
          { keyword: 'システムAバグ', score: 85 },
          { keyword: '本番環境不具合', score: 82 },
          { keyword: '営業問い合わせ増加', score: 75 }
        ]
      })),
      callAction04: jest.fn(async () => ({
        prioritizedList: [
          {
            keyword: 'システムAバグ',
            category: '品質問題',
            priorityScore: 85,
            color: 'red'
          },
          {
            keyword: '本番環境不具合',
            category: '品質問題',
            priorityScore: 82,
            color: 'red'
          },
          {
            keyword: '営業問い合わせ増加',
            category: 'リスク',
            priorityScore: 75,
            color: 'yellow'
          }
        ]
      })),
      callAction05: jest.fn(async () => ({
        emailStatus: 'success',
        deliveryTime: '2024-01-15T09:30:00Z'
      }))
    };

    const result = await runTx3Imp1Agent(
      {
        aggregatedReportIds,
        analysisStartDate,
        analysisEndDate,
        managerUserId,
        priorityThresholdScore
      },
      mockAiClient
    );

    expect(mockAiClient.callAction02).toHaveBeenCalled();
    const action02CallArgs = (mockAiClient.callAction02 as jest.Mock).mock.calls[0];
    expect(action02CallArgs[0]).toBeDefined();
    expect(typeof action02CallArgs[0]).toBe('string');

    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.extractedIssuesCount).toBe(3);
    expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);
    expect(result.prioritizedIssuesList.length).toBeGreaterThan(0);

    result.prioritizedIssuesList.forEach((issue) => {
      expect(issue.category).toBeDefined();
      expect(['品質問題', 'リスク', 'システム障害']).toContain(issue.category);
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    });

    expect(result.prioritizedIssuesList[0].priorityScore).toBeGreaterThanOrEqual(
      result.prioritizedIssuesList[1].priorityScore
    );

    expect(result.emailSendStatus).toBe('success');
    expect(result.completionTimestamp).toBeDefined();

    const action01CallOrder = (mockAiClient.callAction01 as jest.Mock).mock.invocationCallOrder[0];
    const action02CallOrder = (mockAiClient.callAction02 as jest.Mock).mock.invocationCallOrder[0];
    const action03CallOrder = (mockAiClient.callAction03 as jest.Mock).mock.invocationCallOrder[0];

    expect(action01CallOrder).toBeLessThan(action02CallOrder);
    expect(action02CallOrder).toBeLessThan(action03CallOrder);

    expect(buildAction02Prompt).toBeDefined();
    expect(typeof buildAction02Prompt).toBe('function');
    expect(ACTION_02_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_02_PROMPT_VERSION).toBe('string');

    const action02PromptResult = buildAction02Prompt({
      keywords: [
        { keyword: 'システムAバグ', frequency: 3 },
        { keyword: '営業問い合わせ増加', frequency: 2 }
      ]
    });
    expect(action02PromptResult).toBeDefined();
    expect(typeof action02PromptResult).toBe('string');
  });
});