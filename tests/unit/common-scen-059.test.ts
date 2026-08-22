import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';
import type { Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/ai-client';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-3-imp-1/prompts/action-02';

describe('issue-extraction-prioritization', () => {
  // SCEN-059
  test('should classify extracted issue keywords into predefined categories with confidence scores', async () => {
    const inputIssueKeywords = [
      'システムダウン',
      'データベース接続エラー',
      'レポート遅延',
      'セキュリティ警告',
      '顧客クレーム',
    ];

    const expectedCategories = ['システム', 'インフラ', '業務プロセス', 'セキュリティ', '顧客対応'];

    const mockAiClient: Tx3Imp1AiClient = {
      executeAction02: jest.fn(async () => {
        return {
          classifications: [
            { keyword: 'システムダウン', category: 'システム', confidence: 0.95 },
            { keyword: 'データベース接続エラー', category: 'インフラ', confidence: 0.92 },
            { keyword: 'レポート遅延', category: '業務プロセス', confidence: 0.88 },
            { keyword: 'セキュリティ警告', category: 'セキュリティ', confidence: 0.96 },
            { keyword: '顧客クレーム', category: '顧客対応', confidence: 0.94 },
          ],
        };
      }),
    };

    const result = await extractAndRankIssues(inputIssueKeywords, mockAiClient);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(5);

    result.forEach((item, index) => {
      expect(item).toHaveProperty('keyword');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('confidence');
      expect(typeof item.keyword).toBe('string');
      expect(typeof item.category).toBe('string');
      expect(typeof item.confidence).toBe('number');
      expect(expectedCategories).toContain(item.category);
      expect(item.confidence).toBeGreaterThanOrEqual(0.0);
      expect(item.confidence).toBeLessThanOrEqual(1.0);
    });

    const categories = result.map((item) => item.category);
    const uniqueCategories = new Set(categories);
    expect(uniqueCategories.size).toBe(5);

    expect(mockAiClient.executeAction02).toHaveBeenCalled();

    const callArgs = (mockAiClient.executeAction02 as jest.Mock).mock.calls[0];
    if (callArgs && callArgs[0]) {
      const prompt = callArgs[0];
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    }

    expect(ACTION_02_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_02_PROMPT_VERSION).toBe('string');
    expect(ACTION_02_PROMPT_VERSION.length).toBeGreaterThan(0);

    const generatedPrompt = buildAction02Prompt(inputIssueKeywords, expectedCategories);
    expect(generatedPrompt).toBeDefined();
    expect(typeof generatedPrompt).toBe('string');
    expect(generatedPrompt.length).toBeGreaterThan(0);
    expect(generatedPrompt).toContain('システムダウン');
    expect(generatedPrompt).toContain('データベース接続エラー');
    expect(generatedPrompt).toContain('レポート遅延');
    expect(generatedPrompt).toContain('セキュリティ警告');
    expect(generatedPrompt).toContain('顧客クレーム');
  });
});