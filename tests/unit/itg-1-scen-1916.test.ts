import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('Tx8Imp1Agent - 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1916: [error] 課題の再発パターン分析機能 - 分析対象期間の終了日が未指定のときエラーになる
  test('should throw error when analysisEndDate is missing', async () => {
    const fakeAiClient = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      analysisStartDate: '2024-12-16T00:00:00Z',
      analysisEndDate: '',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    await expect(
      runTx8Imp1Agent(input, fakeAiClient)
    ).rejects.toThrow(/終了日/);

    expect(fakeAiClient.extractKeywords).not.toHaveBeenCalled();
    expect(fakeAiClient.assessImpactScore).not.toHaveBeenCalled();
    expect(fakeAiClient.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});