import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: ボトルネック変化パターン可視化レポート生成', () => {
  // SCEN-1995: [error] グラフ形式の自動選択に必要なメタデータが空のとき、レポート生成がエラーになる
  test('メタデータが空の場合、METADATA_VALIDATION_ERRORを発生させる', async () => {
    const fakeAiClient = {
      extractMetadataForGraphSelection: jest.fn().mockResolvedValue({}),
      analyzeCurvePattern: jest.fn(),
      generateVisualizationConfig: jest.fn(),
      classifyBottleneckTrend: jest.fn(),
      buildReportStructure: jest.fn(),
    };

    const input: Tx8AgentInput = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-31T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const issueDataForAnalysis = [
      {
        id: '001',
        keyword: 'database_connection_timeout',
        pattern: 'reoccurrence',
        severity: 'high',
        occurrenceCount: 5,
      },
      {
        id: '002',
        keyword: 'memory_leak',
        pattern: 'increasing_trend',
        severity: 'medium',
        occurrenceCount: 3,
      },
    ];

    const analysisConfig = {
      autoSelectGraphFormat: true,
      metadata: {},
    };

    let caughtError: any;
    try {
      await runTx8Imp1Agent(
        {
          input,
          issueDataForAnalysis,
          analysisConfig,
        },
        fakeAiClient
      );
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.errorCode).toBe('METADATA_VALIDATION_ERROR');
    expect(caughtError.message).toMatch(/グラフ形式自動選択に必要なメタデータが不足/);
    expect(caughtError.missingFields).toContain('chartType');
    expect(caughtError.missingFields).toContain('dataRange');
    expect(caughtError.missingFields).toContain('dimensionFields');
    expect(caughtError.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(fakeAiClient.extractMetadataForGraphSelection).toHaveBeenCalled();
  });
});