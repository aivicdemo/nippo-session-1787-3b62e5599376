import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('TX-10 初回報告データ品質評価機能', () => {
  // SCEN-2592: [error] 初回報告データ品質評価機能 - 形式統一度が未定義のとき評価処理がエラーになる
  test('形式統一度がundefinedのとき品質評価処理がエラーを発生させる', async () => {
    const deploymentInitiationTimestamp = new Date('2026-03-01T09:00:00Z');
    const participantList = [
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm001@example.com',
      },
      {
        userId: 'mgr-001',
        role: 'Manager',
        email: 'manager001@example.com',
      },
      {
        userId: 'eng-001',
        role: 'Engineer',
        email: 'engineer001@example.com',
      },
      {
        userId: 'eng-002',
        role: 'Engineer',
        email: 'engineer002@example.com',
      },
      {
        userId: 'eng-003',
        role: 'Engineer',
        email: 'engineer003@example.com',
      },
      {
        userId: 'eng-004',
        role: 'Engineer',
        email: 'engineer004@example.com',
      },
      {
        userId: 'eng-005',
        role: 'Engineer',
        email: 'engineer005@example.com',
      },
      {
        userId: 'eng-006',
        role: 'Engineer',
        email: 'engineer006@example.com',
      },
      {
        userId: 'eng-007',
        role: 'Engineer',
        email: 'engineer007@example.com',
      },
      {
        userId: 'eng-008',
        role: 'Engineer',
        email: 'engineer008@example.com',
      },
      {
        userId: 'eng-009',
        role: 'Engineer',
        email: 'engineer009@example.com',
      },
      {
        userId: 'eng-010',
        role: 'Engineer',
        email: 'engineer010@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const mockTextAnalysisClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database_issue', frequency: 2 },
          { keyword: 'api_delay', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const mockAiClient = {
      textAnalysisClient: mockTextAnalysisClient,
      generateDeploymentSchedule: jest.fn().mockResolvedValue({
        deploymentSchedule: {
          startDate: new Date('2026-03-05T00:00:00Z'),
          phase1DeadlineDate: new Date('2026-03-12T00:00:00Z'),
          phase2DeadlineDate: new Date('2026-03-19T00:00:00Z'),
          productionStartDate: new Date('2026-03-26T00:00:00Z'),
        },
      }),
      generateTrainingMaterials: jest.fn().mockResolvedValue({
        trainingMaterials: [
          {
            title: 'Manager Guide',
            content: 'Guidelines for managers',
            targetRole: 'Manager',
          },
          {
            title: 'Engineer Training',
            content: 'Training for engineers',
            targetRole: 'Engineer',
          },
        ],
      }),
      evaluateInitialReportQuality: jest.fn().mockRejectedValue(
        new TypeError('Cannot read property of undefined')
      ),
    };

    await expect(
      runTx10Imp1Agent(input, mockAiClient as any)
    ).rejects.toThrow(/形式統一度|formatConsistencyScore|undefined/i);
  });
});