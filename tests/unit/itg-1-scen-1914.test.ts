import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の再発パターン分析機能', () => {
  test('SCEN-1914: 分析対象の課題データが空配列のときエラーになる', async () => {
    const emptyIssueData: any[] = [];

    const mockAiClient = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    let thrownError: any;
    try {
      await runTx8Imp1Agent(
        {
          analysisStartDate: '2024-01-01T00:00:00Z',
          analysisEndDate: '2024-01-31T23:59:59Z',
          teamIds: ['team-001'],
          minimumRecurrenceThreshold: 3,
          recipientManagerId: 'manager-001',
        },
        mockAiClient,
        emptyIssueData
      );
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.code).toBe('EMPTY_ISSUE_DATA');
    expect(thrownError.message).toMatch(/分析対象となる課題がありません/);
    expect(thrownError.statusCode).toBe(400);
    expect(mockAiClient.extractKeywords).not.toHaveBeenCalled();
  });
});