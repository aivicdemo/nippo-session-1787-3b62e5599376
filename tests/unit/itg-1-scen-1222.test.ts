import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ValidatedIssue,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 既存ツール連携機能', () => {
  // SCEN-1222
  test('課題キーが空文字の場合、TextAnalysisServiceAdapterのextractKeywords呼び出しで例外がスローされ、日報送信処理が中断される', async () => {
    const mockExtractedIssues: ExtractedIssue[] = [
      {
        issueId: '',
        issueKey: '',
        title: 'システムバグが発生している',
        description: '本番環境で重大なバグが検出されました',
        detectionDate: new Date('2024-01-15T10:30:00Z'),
        reportedBy: 'engineer-001',
        frequency: 1,
        impactLevel: 'high',
        status: 'open',
      },
    ];

    const mockToolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/api/v3',
      apiToken: 'test-token',
      projectKey: 'PROJ',
    };

    const mockPriorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      urgencyThreshold: 70,
    };

    const mockCategoryMappings = [
      {
        systemCategory: 'bug',
        toolCategory: 'Bug',
        toolCategoryId: '10001',
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation((text: string) => {
        throw new Error('課題キーが未入力です。課題を識別するキーを入力してください');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueData: mockExtractedIssues,
      toolIntegrationConfig: mockToolIntegrationConfig,
      priorityRules: mockPriorityRules,
      categoryMappings: mockCategoryMappings,
    };

    await expect(
      runTx5Imp1Agent(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/課題キー/);
  });
});