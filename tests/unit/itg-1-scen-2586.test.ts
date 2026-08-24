import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 朝会報告アプリ初期導入・ユーザー教育 - 初回報告データ品質評価', () => {
  // SCEN-2586: [error] 初回報告データ品質評価機能 - 提出率が未定義のとき評価処理がエラーになる
  test('should throw ValidationError with SUBMISSION_RATE_UNDEFINED when submissionRate is undefined', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList = [
      { userId: 'PM001', role: 'ProjectManager', email: 'pm@example.com' },
      { userId: 'MGR001', role: 'Manager', email: 'manager@example.com' },
      { userId: 'ENG001', role: 'Engineer', email: 'eng1@example.com' },
      { userId: 'ENG002', role: 'Engineer', email: 'eng2@example.com' },
      { userId: 'ENG003', role: 'Engineer', email: 'eng3@example.com' },
      { userId: 'ENG004', role: 'Engineer', email: 'eng4@example.com' },
      { userId: 'ENG005', role: 'Engineer', email: 'eng5@example.com' },
      { userId: 'ENG006', role: 'Engineer', email: 'eng6@example.com' },
      { userId: 'ENG007', role: 'Engineer', email: 'eng7@example.com' },
      { userId: 'ENG008', role: 'Engineer', email: 'eng8@example.com' },
      { userId: 'ENG009', role: 'Engineer', email: 'eng9@example.com' },
      { userId: 'ENG010', role: 'Engineer', email: 'eng10@example.com' },
    ];

    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database_issue', frequency: 3 },
          { keyword: 'performance_bug', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const initialReportAnalysisResultWithUndefinedSubmissionRate = {
      submissionRate: undefined,
      dataQualityScore: 85,
      formatUniformityScore: 88,
      feedbackItems: [],
    };

    await expect(async () => {
      await runTx10Imp1Agent(input, mockAiClient);
    }).rejects.toThrow(/提出率が未定義/);
  });
});