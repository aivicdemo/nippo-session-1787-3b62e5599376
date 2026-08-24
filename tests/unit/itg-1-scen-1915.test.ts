import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1915: [error] 課題の再発パターン分析機能 - 分析対象期間の開始日が未指定のときエラーになる
  test('SCEN-1915: 分析対象期間の開始日が未指定のときエラーになる', async () => {
    const mockAiClient = {
      extractRecurringPatterns: jest.fn(),
      selectVisualizationGraphs: jest.fn(),
      generateReportId: jest.fn(),
      sendReportEmail: jest.fn(),
    };

    const input = {
      analysisStartDate: '', // 開始日が未指定
      analysisEndDate: '2026-12-31',
      teamIds: ['team-001', 'team-002'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    await expect(async () => {
      await runTx8Imp1Agent(input, mockAiClient);
    }).rejects.toThrow(/開始日/);

    // TextAnalysisServiceAdapterへの呼び出しが実行されていないことを検証
    expect(mockAiClient.extractRecurringPatterns).not.toHaveBeenCalled();
  });
});