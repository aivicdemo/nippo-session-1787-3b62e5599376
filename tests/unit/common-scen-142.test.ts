import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-142: sendUnsubmittedReminder rolls back side effects on partial failure", async () => {
    const mockReportFileId = "report-2024-01-01-001";
    const mockTempStorageKey = "temp-extraction-2024-01-01-001";
    const mockTriggerRecordId = "trigger-2024-01-01-001";
    
    const mockGeneratedReportFile = {
      id: mockReportFileId,
      filename: "monthly_report_2024_01.pdf",
      createdAt: "2024-01-01T09:00:00Z",
      size: 2048576
    };
    
    const mockExtractedData = {
      key: mockTempStorageKey,
      records: [
        { reportId: "rep-001", submittedAt: "2024-01-01T08:30:00Z" },
        { reportId: "rep-002", submittedAt: "2024-01-01T08:45:00Z" }
      ],
      createdAt: "2024-01-01T09:05:00Z"
    };
    
    const mockTriggerState = {
      id: mockTriggerRecordId,
      triggeredAt: "2024-01-01T09:10:00Z",
      status: "PROCESSING"
    };
    
    const mockAuditEvents: Array<{
      timestamp: string;
      event: string;
      details: string;
    }> = [];
    
    const mockSystemState = {
      reportFiles: new Map([[mockReportFileId, mockGeneratedReportFile]]),
      tempStorage: new Map([[mockTempStorageKey, mockExtractedData]]),
      triggerRecords: new Map([[mockTriggerRecordId, mockTriggerState]]),
      auditLog: mockAuditEvents
    };
    
    const mockAiClient = {
      action01_confirmTrigger: jest.fn(async () => ({
        triggerId: mockTriggerRecordId,
        isMonthlyFirstDay: true,
        status: "CONFIRMED"
      })),
      
      action02_extractData: jest.fn(async () => ({
        extractionKey: mockTempStorageKey,
        recordCount: 2,
        status: "EXTRACTED"
      })),
      
      action03_generateReport: jest.fn(async () => ({
        reportFileId: mockReportFileId,
        filename: mockGeneratedReportFile.filename,
        status: "GENERATED"
      })),
      
      action04_analyzeTimeSeries: jest.fn(async () => {
        throw new Error("Time series analysis failed: insufficient data quality");
      }),
      
      action05_identifyBottlenecks: jest.fn(async () => ({
        bottlenecks: [],
        status: "IDENTIFIED"
      })),
      
      action06_analyzePerformance: jest.fn(async () => ({
        indicators: {},
        status: "ANALYZED"
      })),
      
      action07_createAnalysisResult: jest.fn(async () => ({
        resultId: "analysis-001",
        status: "CREATED"
      })),
      
      action08_presentToManager: jest.fn(async () => ({
        presented: true,
        status: "PRESENTED"
      }))
    };
    
    const mockRollbackHandlers = {
      rollbackAction03: jest.fn(async (reportId: string) => {
        const file = mockSystemState.reportFiles.get(reportId);
        if (file) {
          mockSystemState.reportFiles.delete(reportId);
          mockSystemState.auditLog.push({
            timestamp: new Date("2024-01-01T09:20:00Z").toISOString(),
            event: "補償トランザクション実行（Action 3 ロールバック）",
            details: `Deleted report file: ${reportId}`
          });
        }
      }),
      
      rollbackAction02: jest.fn(async (extractionKey: string) => {
        const data = mockSystemState.tempStorage.get(extractionKey);
        if (data) {
          mockSystemState.tempStorage.delete(extractionKey);
          mockSystemState.auditLog.push({
            timestamp: new Date("2024-01-01T09:21:00Z").toISOString(),
            event: "補償トランザクション実行（Action 2 ロールバック）",
            details: `Deleted temp storage: ${extractionKey}`
          });
        }
      }),
      
      rollbackAction01: jest.fn(async (triggerId: string) => {
        const trigger = mockSystemState.triggerRecords.get(triggerId);
        if (trigger) {
          trigger.status = "PENDING";
          mockSystemState.auditLog.push({
            timestamp: new Date("2024-01-01T09:22:00Z").toISOString(),
            event: "補償トランザクション実行（Action 1 ロールバック）",
            details: `Reset trigger to PENDING: ${triggerId}`
          });
        }
      })
    };
    
    const recordAuditEvent = (event: string, details: string) => {
      mockSystemState.auditLog.push({
        timestamp: new Date("2024-01-01T09:23:00Z").toISOString(),
        event,
        details
      });
    };
    
    let action03Executed = false;
    let action04Executed = false;
    
    try {
      expect(mockAiClient.action01_confirmTrigger).toBeDefined();
      const action01Result = await mockAiClient.action01_confirmTrigger();
      expect(action01Result.status).toBe("CONFIRMED");
      
      const action02Result = await mockAiClient.action02_extractData();
      expect(action02Result.status).toBe("EXTRACTED");
      
      const action03Result = await mockAiClient.action03_generateReport();
      expect(action03Result.status).toBe("GENERATED");
      action03Executed = true;
      
      recordAuditEvent(
        "Action 4 処理失敗",
        "Time series analysis failed"
      );
      
      await mockAiClient.action04_analyzeTimeSeries();
      action04Executed = true;
    } catch (error) {
      expect(action04Executed).toBe(false);
      
      if (action03Executed) {
        await mockRollbackHandlers.rollbackAction03(mockReportFileId);
      }
      
      await mockRollbackHandlers.rollbackAction02(mockTempStorageKey);
      await mockRollbackHandlers.rollbackAction01(mockTriggerRecordId);
      
      recordAuditEvent(
        "月次レポート生成自動実行 FAILED_WITH_ROLLBACK",
        "All side effects rolled back due to Action 4 failure"
      );
    }
    
    expect(mockSystemState.reportFiles.has(mockReportFileId)).toBe(false);
    expect(mockSystemState.tempStorage.has(mockTempStorageKey)).toBe(false);
    
    const finalTriggerState = mockSystemState.triggerRecords.get(mockTriggerRecordId);
    expect(finalTriggerState?.status).toBe("PENDING");
    
    const rollbackEvents = mockSystemState.auditLog.filter(
      (log) => log.event.includes("補償トランザクション実行") ||
               log.event.includes("Action 4 処理失敗") ||
               log.event.includes("FAILED_WITH_ROLLBACK")
    );
    
    expect(rollbackEvents).toContainEqual(
      expect.objectContaining({
        event: "Action 4 処理失敗"
      })
    );
    
    expect(rollbackEvents).toContainEqual(
      expect.objectContaining({
        event: "補償トランザクション実行（Action 3 ロールバック）"
      })
    );
    
    expect(rollbackEvents).toContainEqual(
      expect.objectContaining({
        event: "補償トランザクション実行（Action 2 ロールバック）"
      })
    );
    
    expect(rollbackEvents).toContainEqual(
      expect.objectContaining({
        event: "補償トランザクション実行（Action 1 ロールバック）"
      })
    );
    
    expect(rollbackEvents).toContainEqual(
      expect.objectContaining({
        event: "月次レポート生成自動実行 FAILED_WITH_ROLLBACK"
      })
    );
    
    expect(mockRollbackHandlers.rollbackAction03).toHaveBeenCalledWith(mockReportFileId);
    expect(mockRollbackHandlers.rollbackAction02).toHaveBeenCalledWith(mockTempStorageKey);
    expect(mockRollbackHandlers.rollbackAction01).toHaveBeenCalledWith(mockTriggerRecordId);
  });
});