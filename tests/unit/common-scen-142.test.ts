import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-142
  test('途中失敗時に完了済みの副作用を巻き戻す', async () => {
    const auditLogs: Array<{
      timestamp: Date;
      eventType: string;
      details: string;
    }> = [];

    const reportFileStorage: Map<string, { content: string; createdAt: Date }> =
      new Map();
    const temporaryDataStorage: Map<
      string,
      { data: unknown; createdAt: Date }
    > = new Map();
    const triggerStateStorage: Map<string, string> = new Map();

    const fakeAiClient: Tx7Imp1AiClient = {
      async action01_confirmTrigger(request: { targetMonth: string }) {
        auditLogs.push({
          timestamp: new Date('2024-02-01T09:00:00Z'),
          eventType: 'ACTION_01_START',
          details: `Confirming trigger for month: ${request.targetMonth}`,
        });

        triggerStateStorage.set('monthly_trigger_2024_02', 'processing');

        auditLogs.push({
          timestamp: new Date('2024-02-01T09:00:05Z'),
          eventType: 'ACTION_01_COMPLETE',
          details: 'Trigger state recorded: processing',
        });

        return {
          triggerConfirmed: true,
          targetMonth: request.targetMonth,
          triggerType: 'schedule',
        };
      },

      async action02_extractData(request: { targetMonth: string }) {
        auditLogs.push({
          timestamp: new Date('2024-02-01T09:00:10Z'),
          eventType: 'ACTION_02_START',
          details: `Extracting data for month: ${request.targetMonth}`,
        });

        const extractedData = {
          reportCount: 47,
          teamCount: 5,
          issueCount: 127,
          extractedAt: '2024-02-01T09:00:10Z',
        };

        temporaryDataStorage.set(
          `temp_data_${request.targetMonth}`,
          {
            data: extractedData,
            createdAt: new Date('2024-02-01T09:00:10Z'),
          }
        );

        auditLogs.push({
          timestamp: new Date('2024-02-01T09:00:15Z'),
          eventType: 'ACTION_02_COMPLETE',
          details: `Data extracted and stored: ${JSON.stringify(extractedData)}`,
        });

        return {
          dataExtracted: true,
          reportCount: extractedData.reportCount,
          teamCount: extractedData.teamCount,
        };
      },

      async action03_generateReport(request: {
        targetMonth: string;
        reportData: unknown;
      }) {
        auditLogs.push({
          timestamp: new Date('2024-02-01T09:00:20Z'),
          eventType: 'ACTION_03_START',
          details: `Generating report for month: ${request.targetMonth}`,
        });

        const reportFileId = `report_2024_02_${Date.now()}`;
        const reportContent = JSON.stringify({
          month: request.targetMonth,
          generatedAt: '2024-02-01T09:00:20Z',
          data: request.reportData,
        });

        reportFileStorage.set(reportFileId, {
          content: reportContent,
          createdAt: new Date('2024-02-01T09:00:20Z'),
        });

        auditLogs.push({
          timestamp: new Date('2024-02-01T09:00:25Z'),
          eventType: 'ACTION_03_COMPLETE',
          details: `Report file generated: ${reportFileId}`,
        });

        return {
          reportGenerated: true,
          reportId: reportFileId,
          contentSize: reportContent.length,
        };
      },

      async action04_analyzeTimeSeries(request: {
        targetMonth: string;
        extractedData: unknown;
      }) {
        auditLogs.push({
          timestamp: new Date('2024-02-01T09:00:30Z'),
          eventType: 'ACTION_04_START',
          details: `Analyzing time series for month: ${request.targetMonth}`,
        });

        throw new Error('時系列分析エラー: データセットが不完全です');
      },

      async action05_identifyBottleneck(request: { targetMonth: string }) {
        return { bottlenecks: [] };
      },

      async action06_calculateMetrics(request: { targetMonth: string }) {
        return { metrics: {} };
      },

      async action07_composeAnalysisResult(request: {
        targetMonth: string;
      }) {
        return { analysisResult: null };
      },

      async action08_deliverReport(request: { targetMonth: string }) {
        return { delivered: false };
      },

      async rollbackAction03() {
        auditLogs.push({
          timestamp: new Date('2024-02-01T09:01:00Z'),
          eventType: 'COMPENSATION_ACTION_03',
          details: 'Rolling back Action 03: Deleting generated report files',
        });

        for (const [key] of reportFileStorage) {
          reportFileStorage.delete(key);
        }

        auditLogs.push({
          timestamp: new Date('2024-02-01T09:01:05Z'),
          eventType: 'COMPENSATION_ACTION_03_COMPLETE',
          details: 'Action 03 rollback completed: All report files deleted',
        });

        return { rolledBack: true };
      },

      async rollbackAction02() {
        auditLogs.push({
          timestamp: new Date('2024-02-01T09:01:10Z'),
          eventType: 'COMPENSATION_ACTION_02',
          details: 'Rolling back Action 02: Deleting temporary data',
        });

        for (const [key] of temporaryDataStorage) {
          temporaryDataStorage.delete(key);
        }

        auditLogs.push({
          timestamp: new Date('2024-02-01T09:01:15Z'),
          eventType: 'COMPENSATION_ACTION_02_COMPLETE',
          details: 'Action 02 rollback completed: All temporary data deleted',
        });

        return { rolledBack: true };
      },

      async rollbackAction01() {
        auditLogs.push({
          timestamp: new Date('2024-02-01T09:01:20Z'),
          eventType: 'COMPENSATION_ACTION_01',
          details: 'Rolling back Action 01: Resetting trigger state',
        });

        triggerStateStorage.delete('monthly_trigger_2024_02');

        auditLogs.push({
          timestamp: new Date('2024-02-01T09:01:25Z'),
          eventType: 'COMPENSATION_ACTION_01_COMPLETE',
          details: 'Action 01 rollback completed: Trigger state reset',
        });

        return { rolledBack: true };
      },
    };

    const request = {
      targetMonth: '2024-02',
      teamId: 'team-engineering',
      triggeredBy: 'schedule' as const,
      includeDetailedAnalysis: true,
    };

    let caughtError: Error | null = null;
    try {
      await runTx7Imp1Agent(request, fakeAiClient);
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/時系列分析エラー/);

    expect(reportFileStorage.size).toBe(0);
    expect(temporaryDataStorage.size).toBe(0);
    expect(triggerStateStorage.get('monthly_trigger_2024_02')).toBeUndefined();

    const action04FailLog = auditLogs.find(
      (log) => log.eventType === 'ACTION_04_START'
    );
    expect(action04FailLog).toBeDefined();

    const compensationLogs = auditLogs.filter(
      (log) =>
        log.eventType.startsWith('COMPENSATION_') ||
        log.eventType === 'COMPENSATION_ACTION_03_COMPLETE' ||
        log.eventType === 'COMPENSATION_ACTION_02_COMPLETE' ||
        log.eventType === 'COMPENSATION_ACTION_01_COMPLETE'
    );

    expect(compensationLogs.length).toBeGreaterThanOrEqual(6);

    const action03RollbackLog = auditLogs.find(
      (log) => log.eventType === 'COMPENSATION_ACTION_03'
    );
    expect(action03RollbackLog).toBeDefined();
    expect(action03RollbackLog?.details).toMatch(/削除/);

    const action02RollbackLog = auditLogs.find(
      (log) => log.eventType === 'COMPENSATION_ACTION_02'
    );
    expect(action02RollbackLog).toBeDefined();
    expect(action02RollbackLog?.details).toMatch(/削除/);

    const action01RollbackLog = auditLogs.find(
      (log) => log.eventType === 'COMPENSATION_ACTION_01'
    );
    expect(action01RollbackLog).toBeDefined();
    expect(action01RollbackLog?.details).toMatch(/リセット/);

    const compensationCompleteOrder = [
      'COMPENSATION_ACTION_03_COMPLETE',
      'COMPENSATION_ACTION_02_COMPLETE',
      'COMPENSATION_ACTION_01_COMPLETE',
    ];

    let lastFoundIndex = -1;
    for (const eventType of compensationCompleteOrder) {
      const logIndex = auditLogs.findIndex((log) => log.eventType === eventType);
      if (logIndex !== -1) {
        expect(logIndex).toBeGreaterThan(lastFoundIndex);
        lastFoundIndex = logIndex;
      }
    }
  });
});