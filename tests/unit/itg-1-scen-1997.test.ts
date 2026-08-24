import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('ボトルネック変化パターン可視化レポート生成機能', () => {
  // SCEN-1997
  test('TextAnalysisServiceAdapterが課題キーワード抽出に失敗したとき、レポート生成がエラーになる', async () => {
    const input = {
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-15T00:00:00Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const stubAiClient = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('Keyword extraction failed');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const issueData = [
      { id: 'ISSUE-001', text: 'データベース接続エラー' },
      { id: 'ISSUE-002', text: 'デプロイ失敗' },
    ];

    let thrownError: Error | null = null;
    try {
      await runTx8Imp1Agent(input, stubAiClient);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/TextAnalysisServiceAdapter/);
    expect(thrownError?.message).toMatch(/keyword extraction/);
    expect(stubAiClient.extractKeywords).toHaveBeenCalled();
  });
});