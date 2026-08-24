import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題の再発パターン分析機能', () => {
  test('SCEN-1913: 同じ入力データで複数回実行しても同じグループ分けと頻度が返される', async () => {
    const testInputText =
      'ログイン機能のバグ、データベース接続エラー、ログイン機能のバグ';
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-31';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'manager-001';

    const aiClientCallRecords: {
      action: string;
      params: unknown;
      result: unknown;
    }[] = [];

    const mockAiClient: Tx8Imp1AiClient = {
      extractKeywords: async (params: unknown) => {
        aiClientCallRecords.push({
          action: 'extractKeywords',
          params,
          result: undefined,
        });
        return {
          keywords: [
            { keyword: 'ログイン機能のバグ', frequency: 2 },
            { keyword: 'データベース接続エラー', frequency: 1 },
          ],
        };
      },
      assessImpactScore: async (params: unknown) => {
        aiClientCallRecords.push({
          action: 'assessImpactScore',
          params,
          result: undefined,
        });
        return {
          'ログイン機能のバグ': 75,
          'データベース接続エラー': 85,
        };
      },
      classifyIssueSeverity: async (params: unknown) => {
        aiClientCallRecords.push({
          action: 'classifyIssueSeverity',
          params,
          result: undefined,
        });
        return {
          'ログイン機能のバグ': 'high',
          'データベース接続エラー': 'high',
        };
      },
      generateTimeSeriesPattern: async (params: unknown) => {
        aiClientCallRecords.push({
          action: 'generateTimeSeriesPattern',
          params,
          result: undefined,
        });
        return {
          'ログイン機能のバグ': '増加傾向',
          'データベース接続エラー': '周期的',
        };
      },
      selectVisualizationGraphs: async (params: unknown) => {
        aiClientCallRecords.push({
          action: 'selectVisualizationGraphs',
          params,
          result: undefined,
        });
        return {
          graphs: [
            {
              graphType: '折れ線',
              title: '課題発生頻度の推移',
              dataPoints: [
                { date: '2024-01-01', count: 1 },
                { date: '2024-01-31', count: 2 },
              ],
            },
            {
              graphType: '棒',
              title: 'カテゴリ別課題件数',
              dataPoints: [
                { category: 'ログイン機能のバグ', count: 2 },
                { category: 'データベース接続エラー', count: 1 },
              ],
            },
          ],
        };
      },
    };

    const executeAnalysisOnce = async () => {
      const input = {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
        issueTexts: [testInputText],
      };

      aiClientCallRecords.length = 0;

      const output = await runTx8Imp1Agent(input, mockAiClient);

      return {
        output,
        callRecords: [...aiClientCallRecords],
      };
    };

    const execution1 = await executeAnalysisOnce();
    const execution2 = await executeAnalysisOnce();
    const execution3 = await executeAnalysisOnce();

    expect(execution1.output.recurringIssuePatterns).toHaveLength(2);
    expect(execution2.output.recurringIssuePatterns).toHaveLength(2);
    expect(execution3.output.recurringIssuePatterns).toHaveLength(2);

    expect(execution1.output.recurringIssuePatterns[0].issueKeyword).toBe(
      'ログイン機能のバグ'
    );
    expect(execution2.output.recurringIssuePatterns[0].issueKeyword).toBe(
      'ログイン機能のバグ'
    );
    expect(execution3.output.recurringIssuePatterns[0].issueKeyword).toBe(
      'ログイン機能のバグ'
    );

    expect(execution1.output.recurringIssuePatterns[0].occurrenceCount).toBe(2);
    expect(execution2.output.recurringIssuePatterns[0].occurrenceCount).toBe(2);
    expect(execution3.output.recurringIssuePatterns[0].occurrenceCount).toBe(2);

    expect(execution1.output.recurringIssuePatterns[1].issueKeyword).toBe(
      'データベース接続エラー'
    );
    expect(execution2.output.recurringIssuePatterns[1].issueKeyword).toBe(
      'データベース接続エラー'
    );
    expect(execution3.output.recurringIssuePatterns[1].issueKeyword).toBe(
      'データベース接続エラー'
    );

    expect(execution1.output.recurringIssuePatterns[1].occurrenceCount).toBe(1);
    expect(execution2.output.recurringIssuePatterns[1].occurrenceCount).toBe(1);
    expect(execution3.output.recurringIssuePatterns[1].occurrenceCount).toBe(1);

    expect(execution1.output.recurringIssuePatterns[0].timeSeriesPattern).toBe(
      '増加傾向'
    );
    expect(execution2.output.recurringIssuePatterns[0].timeSeriesPattern).toBe(
      '増加傾向'
    );
    expect(execution3.output.recurringIssuePatterns[0].timeSeriesPattern).toBe(
      '増加傾向'
    );

    expect(execution1.output.recurringIssuePatterns[1].timeSeriesPattern).toBe(
      '周期的'
    );
    expect(execution2.output.recurringIssuePatterns[1].timeSeriesPattern).toBe(
      '周期的'
    );
    expect(execution3.output.recurringIssuePatterns[1].timeSeriesPattern).toBe(
      '周期的'
    );

    expect(execution1.output.recurringIssuePatterns[0].priorityScore).toBe(75);
    expect(execution2.output.recurringIssuePatterns[0].priorityScore).toBe(75);
    expect(execution3.output.recurringIssuePatterns[0].priorityScore).toBe(75);

    expect(execution1.output.recurringIssuePatterns[1].priorityScore).toBe(85);
    expect(execution2.output.recurringIssuePatterns[1].priorityScore).toBe(85);
    expect(execution3.output.recurringIssuePatterns[1].priorityScore).toBe(85);

    expect(execution1.output.visualizationGraphs).toHaveLength(2);
    expect(execution2.output.visualizationGraphs).toHaveLength(2);
    expect(execution3.output.visualizationGraphs).toHaveLength(2);

    expect(execution1.output.visualizationGraphs[0].graphType).toBe('折れ線');
    expect(execution2.output.visualizationGraphs[0].graphType).toBe('折れ線');
    expect(execution3.output.visualizationGraphs[0].graphType).toBe('折れ線');

    expect(execution1.output.visualizationGraphs[1].graphType).toBe('棒');
    expect(execution2.output.visualizationGraphs[1].graphType).toBe('棒');
    expect(execution3.output.visualizationGraphs[1].graphType).toBe('棒');

    expect(execution1.callRecords).toHaveLength(5);
    expect(execution2.callRecords).toHaveLength(5);
    expect(execution3.callRecords).toHaveLength(5);

    expect(execution1.callRecords[0].action).toBe('extractKeywords');
    expect(execution2.callRecords[0].action).toBe('extractKeywords');
    expect(execution3.callRecords[0].action).toBe('extractKeywords');

    expect(execution1.callRecords[0].params).toEqual(execution2.callRecords[0].params);
    expect(execution2.callRecords[0].params).toEqual(execution3.callRecords[0].params);

    expect(execution1.callRecords[1].action).toBe('assessImpactScore');
    expect(execution2.callRecords[1].action).toBe('assessImpactScore');
    expect(execution3.callRecords[1].action).toBe('assessImpactScore');

    expect(execution1.callRecords[1].params).toEqual(execution2.callRecords[1].params);
    expect(execution2.callRecords[1].params).toEqual(execution3.callRecords[1].params);

    expect(execution1.callRecords[2].action).toBe('classifyIssueSeverity');
    expect(execution2.callRecords[2].action).toBe('classifyIssueSeverity');
    expect(execution3.callRecords[2].action).toBe('classifyIssueSeverity');

    expect(execution1.callRecords[2].params).toEqual(execution2.callRecords[2].params);
    expect(execution2.callRecords[2].params).toEqual(execution3.callRecords[2].params);

    expect(execution1.callRecords[3].action).toBe('generateTimeSeriesPattern');
    expect(execution2.callRecords[3].action).toBe('generateTimeSeriesPattern');
    expect(execution3.callRecords[3].action).toBe('generateTimeSeriesPattern');

    expect(execution1.callRecords[3].params).toEqual(execution2.callRecords[3].params);
    expect(execution2.callRecords[3].params).toEqual(execution3.callRecords[3].params);

    expect(execution1.callRecords[4].action).toBe('selectVisualizationGraphs');
    expect(execution2.callRecords[4].action).toBe('selectVisualizationGraphs');
    expect(execution3.callRecords[4].action).toBe('selectVisualizationGraphs');

    expect(execution1.callRecords[4].params).toEqual(execution2.callRecords[4].params);
    expect(execution2.callRecords[4].params).toEqual(execution3.callRecords[4].params);

    expect(execution1.output.reportId).toBeDefined();
    expect(execution2.output.reportId).toBeDefined();
    expect(execution3.output.reportId).toBeDefined();

    expect(execution1.output.emailSentAt).toBeDefined();
    expect(execution2.output.emailSentAt).toBeDefined();
    expect(execution3.output.emailSentAt).toBeDefined();
  });
});