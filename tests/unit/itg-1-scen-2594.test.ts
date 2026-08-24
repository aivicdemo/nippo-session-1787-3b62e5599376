import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1: 朝会報告アプリ初期導入・ユーザー教育エージェント', () => {
  // SCEN-2594
  test('[error] 初回報告データ品質評価機能 - 提出率が負の数のとき評価処理がエラーになる', async () => {
    const invalidInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: [
        {
          userId: 'pm-001',
          role: 'ProjectManager',
          email: 'pm@example.com'
        },
        {
          userId: 'mgr-001',
          role: 'Manager',
          email: 'manager@example.com'
        },
        {
          userId: 'eng-001',
          role: 'Engineer',
          email: 'eng001@example.com'
        },
        {
          userId: 'eng-002',
          role: 'Engineer',
          email: 'eng002@example.com'
        },
        {
          userId: 'eng-003',
          role: 'Engineer',
          email: 'eng003@example.com'
        },
        {
          userId: 'eng-004',
          role: 'Engineer',
          email: 'eng004@example.com'
        },
        {
          userId: 'eng-005',
          role: 'Engineer',
          email: 'eng005@example.com'
        },
        {
          userId: 'eng-006',
          role: 'Engineer',
          email: 'eng006@example.com'
        },
        {
          userId: 'eng-007',
          role: 'Engineer',
          email: 'eng007@example.com'
        },
        {
          userId: 'eng-008',
          role: 'Engineer',
          email: 'eng008@example.com'
        },
        {
          userId: 'eng-009',
          role: 'Engineer',
          email: 'eng009@example.com'
        },
        {
          userId: 'eng-010',
          role: 'Engineer',
          email: 'eng010@example.com'
        }
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00'
    };

    const mockAiClient = {
      validateDeploymentInputs: jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['提出率は0以上1以下の値である必要があります']
      }),
      analyzeInitialReportQuality: jest.fn().mockRejectedValue(
        new RangeError('提出率は0以上1以下の値である必要があります')
      ),
      generateTrainingMaterials: jest.fn().mockResolvedValue([]),
      evaluateOnboardingReadiness: jest.fn().mockResolvedValue({
        approved: false,
        reason: 'Validation failed before evaluation'
      }),
      scheduleNotifications: jest.fn().mockResolvedValue(true),
      logDeploymentEvent: jest.fn().mockResolvedValue(undefined)
    };

    await expect(
      runTx10Imp1Agent(invalidInput, mockAiClient)
    ).rejects.toThrow(/提出率/);
  });
});