import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: Recurring issue pattern visualization report generation', () => {
  // SCEN-1990
  test('should throw DataQualityError when issue resolution period data is missing', async () => {
    const mockAiClient = {
      action01ExtractIssueData: jest.fn(async () => ({
        issues: [
          {
            issueKeyword: 'database_performance',
            occurrenceCount: 5,
            resolutionPeriodDays: 3,
            impactScore: 75,
            firstReportedDate: '2024-01-08',
            lastReportedDate: '2024-01-15',
          },
          {
            issueKeyword: 'api_timeout',
            occurrenceCount: 3,
            resolutionPeriodDays: null,
            impactScore: 60,
            firstReportedDate: '2024-01-10',
            lastReportedDate: '2024-01-14',
          },
          {
            issueKeyword: 'memory_leak',
            occurrenceCount: 2,
            resolutionPeriodDays: undefined,
            impactScore: 85,
            firstReportedDate: '2024-01-12',
            lastReportedDate: '2024-01-15',
          },
          {
            issueKeyword: 'deployment_failure',
            occurrenceCount: 4,
            resolutionPeriodDays: '',
            impactScore: 90,
            firstReportedDate: '2024-01-09',
            lastReportedDate: '2024-01-15',
          },
        ],
        totalIssuesExtracted: 4,
      })),
      action02AnalyzeTimeSeriesPattern: jest.fn(),
      action03IdentifyBottleneckTrend: jest.fn(),
      action04GenerateVisualizationReport: jest.fn(),
      action05AssessDataQuality: jest.fn(async (issueDataset) => {
        const missingResolutionPeriods = issueDataset.issues.filter(
          (issue) =>
            issue.resolutionPeriodDays === null ||
            issue.resolutionPeriodDays === undefined ||
            issue.resolutionPeriodDays === ''
        );

        if (missingResolutionPeriods.length > 0) {
          const error = new Error(
            `解決期間が欠落した課題レコードが ${missingResolutionPeriods.length} 件検出されました。データ品質が基準以下であるため、レポート生成を中止します。`
          );
          (error as any).name = 'DataQualityError';
          (error as any).escalationConditionTriggered = true;
          throw error;
        }

        return { dataQualityScore: 100, passedValidation: true };
      }),
    };

    const testInput: Tx8AgentInput = {
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-15',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 2,
      recipientManagerId: 'manager-001',
    };

    await expect(runTx8Imp1Agent(testInput, mockAiClient as any)).rejects.toThrow(
      /解決期間が欠落/
    );

    expect(mockAiClient.action01ExtractIssueData).toHaveBeenCalledWith(
      testInput.analysisStartDate,
      testInput.analysisEndDate,
      testInput.teamIds
    );

    expect(mockAiClient.action05AssessDataQuality).toHaveBeenCalled();

    expect(mockAiClient.action04GenerateVisualizationReport).not.toHaveBeenCalled();
  });
});