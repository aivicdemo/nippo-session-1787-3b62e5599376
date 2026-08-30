import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('Tx2Imp1Agent - 日報受信から課題抽出・優先度付け・確認メール配信まで', () => {
  // SCEN-006: データベース接続失敗時のエラーハンドリング
  test('日報データベースから当日の日報を取得できない場合、ReportDataRetrievalErrorが発生する', async () => {
    const mockAiClient = {
      extractIssueKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockDbConnection = {
      getSubmissionStatus: jest.fn().mockRejectedValueOnce(
        new Error('Database connection failed')
      ),
      getTeamReports: jest.fn(),
      getTeamMembers: jest.fn(),
    };

    const executionDate = new Date('2024-01-15T09:00:00Z');
    const teamIds = undefined;
    const managerNotificationEnabled = true;

    const executeAgent = async () => {
      return runTx2Imp1Agent(
        {
          executionDate,
          teamIds,
          managerNotificationEnabled,
        },
        mockAiClient,
        mockDbConnection
      );
    };

    await expect(executeAgent).rejects.toThrow(/日報データの取得に失敗しました/);
  });
});