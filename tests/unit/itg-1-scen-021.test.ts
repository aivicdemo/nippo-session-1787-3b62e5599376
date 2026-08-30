import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  test('SCEN-021: aggregationPeriodStart が null のときレポート生成トリガーが確認されていないエラーをスロー', async () => {
    const input = {
      aggregationPeriodStart: null as unknown as Date,
      aggregationPeriodEnd: new Date('2026-02-28'),
      targetTeamIds: ['team-001'],
      reportOutputFormat: 'summary',
      managerUserId: 'mgr-001',
    };

    const fakeAiClient = {
      callChatModel: jest.fn(),
      extractStructuredOutput: jest.fn(),
    };

    await expect(
      runTx7Imp1Agent(input, fakeAiClient)
    ).rejects.toThrow(/レポート生成トリガー/);
  });
});