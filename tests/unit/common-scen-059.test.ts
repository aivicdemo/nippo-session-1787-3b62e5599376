import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-3-imp-1/prompts/action-02';

describe('Tx3Imp1Agent - Category Classification Action', () => {
  // SCEN-059: [normal] 日報集約から優先度別課題一覧提示までの自動判定・配信 AIエージェント
  test('should classify extracted issues into predefined categories with confidence scores', async () => {
    // Arrange: Extract test data - 5 issue keywords to be classified
    const extractedIssues = [
      { keyword: 'システムダウン', frequency: 3, impactScope: 'entire_system' },
      { keyword: 'データベース接続エラー', frequency: 5, impactScope: 'backend' },
      { keyword: 'レポート遅延', frequency: 2, impactScope: 'business_process' },
      { keyword: 'セキュリティ警告', frequency: 1, impactScope: 'security' },
      { keyword: '顧客クレーム', frequency: 4, impactScope: 'customer_facing' },
    ];

    // Define predefined category master data
    const predefinedCategories = [
      'システム',
      'インフラ',
      '業務プロセス',
      'セキュリティ',
      '顧客対応',
    ];

    // Mock AI client that implements Tx3Imp1AiClient interface
    const mockAiClient: Tx3Imp1AiClient = {
      executeAction02Prompt: async (prompt: string) => {
        // Verify that buildAction02Prompt constructs correct category classification schema
        expect(ACTION_02_PROMPT_VERSION).toBeDefined();
        expect(typeof ACTION_02_PROMPT_VERSION).toBe('string');
        
        const builtPrompt = buildAction02Prompt(extractedIssues, predefinedCategories);
        expect(builtPrompt).toBeDefined();
        expect(typeof builtPrompt).toBe('string');
        expect(builtPrompt).toContain('カテゴリ');

        // Return classification response with all 5 issues classified into predefined categories
        return {
          classifiedIssues: [
            {
              keyword: 'システムダウン',
              category: 'システム',
              confidence: 0.95,
            },
            {
              keyword: 'データベース接続エラー',
              category: 'インフラ',
              confidence: 0.92,
            },
            {
              keyword: 'レポート遅延',
              category: '業務プロセス',
              confidence: 0.88,
            },
            {
              keyword: 'セキュリティ警告',
              category: 'セキュリティ',
              confidence: 0.97,
            },
            {
              keyword: '顧客クレーム',
              category: '顧客対応',
              confidence: 0.90,
            },
          ],
        };
      },
    };

    // Prepare input for runTx3Imp1Agent
    const input = {
      reportAggregationId: 'agg_2024_01_15_001',
      analysisExecutionTime: new Date('2024-01-15T09:00:00Z'),
      managerEmail: 'manager@example.com',
      priorityThresholds: {
        highPriorityMinScore: 70,
        mediumPriorityMinScore: 40,
      },
    };

    // Act: Execute the orchestrator with mock AI client
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert: Verify that action-02 (category classification) executed correctly
    expect(result).toBeDefined();
    expect(result.extractedIssues).toBeDefined();
    expect(Array.isArray(result.extractedIssues)).toBe(true);
    expect(result.extractedIssues.length).toBe(5);

    // Verify each classified issue has required structure
    result.extractedIssues.forEach((issue: any) => {
      expect(issue).toHaveProperty('keyword');
      expect(issue).toHaveProperty('category');
      expect(issue).toHaveProperty('confidence');
      expect(typeof issue.keyword).toBe('string');
      expect(typeof issue.category).toBe('string');
      expect(typeof issue.confidence).toBe('number');
    });

    // Verify all keywords are classified into predefined categories
    const classifiedCategories = result.extractedIssues.map((i: any) => i.category);
    classifiedCategories.forEach((category: string) => {
      expect(predefinedCategories).toContain(category);
    });

    // Verify confidence scores are in valid range (0.0 to 1.0)
    result.extractedIssues.forEach((issue: any) => {
      expect(issue.confidence).toBeGreaterThanOrEqual(0.0);
      expect(issue.confidence).toBeLessThanOrEqual(1.0);
    });

    // Verify no duplicate classifications and all issues are classified
    const keywordSet = new Set(result.extractedIssues.map((i: any) => i.keyword));
    expect(keywordSet.size).toBe(5);
    expect(result.extractedIssues.every((i: any) => i.category !== undefined && i.category !== '')).toBe(true);

    // Verify ACTION_02_PROMPT_VERSION is accessible
    expect(ACTION_02_PROMPT_VERSION).toBeDefined();
    expect(ACTION_02_PROMPT_VERSION.length).toBeGreaterThan(0);

    // Verify buildAction02Prompt is callable
    expect(typeof buildAction02Prompt).toBe('function');
  });
});