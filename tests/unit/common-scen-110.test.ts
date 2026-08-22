import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-04';

describe('Tx6Imp1Agent', () => {
  // SCEN-110: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント
  test('should execute issue frequency and category trend analysis on submitted reports', async () => {
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-07';
    const teamId = 'team-001';
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');

    const sampleReports = [
      {
        reportId: 'report-001',
        memberId: 'member-A',
        submittedAt: new Date('2024-01-07T18:00:00Z'),
        content: {
          accomplishments: 'Completed feature X',
          todaysTasks: 'Start feature Y',
          issues: 'システム連携エラーが発生'
        }
      },
      {
        reportId: 'report-002',
        memberId: 'member-B',
        submittedAt: new Date('2024-01-07T17:30:00Z'),
        content: {
          accomplishments: 'Code review completed',
          todaysTasks: 'Deploy to staging',
          issues: 'ドキュメント未更新'
        }
      },
      {
        reportId: 'report-003',
        memberId: 'member-C',
        submittedAt: new Date('2024-01-07T17:00:00Z'),
        content: {
          accomplishments: 'Testing phase started',
          todaysTasks: 'Continue testing',
          issues: 'テスト環境不足'
        }
      },
      {
        reportId: 'report-004',
        memberId: 'member-D',
        submittedAt: new Date('2024-01-07T16:45:00Z'),
        content: {
          accomplishments: 'API implementation done',
          todaysTasks: 'Integration testing',
          issues: 'システム連携エラー'
        }
      },
      {
        reportId: 'report-005',
        memberId: 'member-E',
        submittedAt: new Date('2024-01-06T18:00:00Z'),
        content: {
          accomplishments: 'DB schema updated',
          todaysTasks: 'Migration script ready',
          issues: 'コミュニケーション遅延'
        }
      },
      {
        reportId: 'report-006',
        memberId: 'member-F',
        submittedAt: new Date('2024-01-06T17:30:00Z'),
        content: {
          accomplishments: 'Security audit passed',
          todaysTasks: 'Deploy security patch',
          issues: 'システム連携エラー'
        }
      },
      {
        reportId: 'report-007',
        memberId: 'member-G',
        submittedAt: new Date('2024-01-05T18:00:00Z'),
        content: {
          accomplishments: 'Infrastructure setup',
          todaysTasks: 'Configure monitoring',
          issues: 'ドキュメント未更新'
        }
      },
      {
        reportId: 'report-008',
        memberId: 'member-H',
        submittedAt: new Date('2024-01-05T17:45:00Z'),
        content: {
          accomplishments: 'Training materials prepared',
          todaysTasks: 'Conduct session',
          issues: 'テスト環境不足'
        }
      }
    ];

    const mockAiClient = {
      callAction01: jest.fn().mockResolvedValue({}),
      callAction02: jest.fn().mockResolvedValue({}),
      callAction03: jest.fn().mockResolvedValue({}),
      callAction04: jest.fn().mockResolvedValue({
        analysisResult: {
          analysisPeriod: {
            startDate: analysisStartDate,
            endDate: analysisEndDate
          },
          issueCategories: [
            {
              categoryName: 'システム連携エラー',
              frequencyCount: 4,
              categoryRatio: 0.33
            },
            {
              categoryName: 'ドキュメント未更新',
              frequencyCount: 3,
              categoryRatio: 0.25
            },
            {
              categoryName: 'テスト環境不足',
              frequencyCount: 3,
              categoryRatio: 0.25
            },
            {
              categoryName: 'コミュニケーション遅延',
              frequencyCount: 2,
              categoryRatio: 0.17
            }
          ],
          executedAt: new Date('2024-01-08T09:00:00Z').toISOString()
        }
      }),
      callAction05: jest.fn().mockResolvedValue({}),
      callAction06: jest.fn().mockResolvedValue({}),
      callAction07: jest.fn().mockResolvedValue({})
    };

    const input = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId
    };

    const result = await runTx6Imp1Agent(input, mockAiClient as any);

    expect(mockAiClient.callAction04).toHaveBeenCalled();

    const action04Call = mockAiClient.callAction04.mock.calls[0];
    const promptPassedToAction04 = action04Call[0];

    expect(promptPassedToAction04).toBeDefined();
    expect(promptPassedToAction04).toContain(ACTION_04_PROMPT_VERSION);

    const analysisResult = result.analysisResult || mockAiClient.callAction04.mock.results[0].value.analysisResult;

    expect(analysisResult).toBeDefined();
    expect(analysisResult.issueCategories).toBeDefined();
    expect(Array.isArray(analysisResult.issueCategories)).toBe(true);

    const systemIntegrationError = analysisResult.issueCategories.find(
      (issue: any) => issue.categoryName === 'システム連携エラー'
    );
    expect(systemIntegrationError).toBeDefined();
    expect(systemIntegrationError.frequencyCount).toBe(4);
    expect(systemIntegrationError.categoryRatio).toBe(0.33);

    const docNotUpdated = analysisResult.issueCategories.find(
      (issue: any) => issue.categoryName === 'ドキュメント未更新'
    );
    expect(docNotUpdated).toBeDefined();
    expect(docNotUpdated.frequencyCount).toBe(3);
    expect(docNotUpdated.categoryRatio).toBe(0.25);

    const testEnvShortage = analysisResult.issueCategories.find(
      (issue: any) => issue.categoryName === 'テスト環境不足'
    );
    expect(testEnvShortage).toBeDefined();
    expect(testEnvShortage.frequencyCount).toBe(3);
    expect(testEnvShortage.categoryRatio).toBe(0.25);

    const communicationDelay = analysisResult.issueCategories.find(
      (issue: any) => issue.categoryName === 'コミュニケーション遅延'
    );
    expect(communicationDelay).toBeDefined();
    expect(communicationDelay.frequencyCount).toBe(2);
    expect(communicationDelay.categoryRatio).toBe(0.17);

    expect(analysisResult.analysisPeriod.startDate).toBe(analysisStartDate);
    expect(analysisResult.analysisPeriod.endDate).toBe(analysisEndDate);

    const executedAtTime = new Date(analysisResult.executedAt);
    const timeDiffMs = Math.abs(executedAtTime.getTime() - executionTimestamp.getTime());
    expect(timeDiffMs).toBeLessThanOrEqual(60000);
  });
});