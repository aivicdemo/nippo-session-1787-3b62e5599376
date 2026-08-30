import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { saveExtractedIssueData, type SaveExtractedIssueDataInput, type SaveExtractedIssueDataOutput } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence - saveExtractedIssueData', () => {
  let consoleWarnSpy: ReturnType<typeof jest.spyOn>;
  let mockEncryptReportData: jest.Mock;
  let mockRecordIssueAuditLog: jest.Mock;
  let mockValidateIssueDataIntegrity: jest.Mock;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    mockEncryptReportData = jest.fn().mockResolvedValue({
      encryptedContent: 'encrypted_content_string',
      encryptionTimestamp: '2024-01-15T09:30:00Z',
      encryptionVersion: 'v1.0',
    });

    mockRecordIssueAuditLog = jest.fn().mockResolvedValue({
      auditLogId: 'audit-log-001',
      recordedAt: new Date('2024-01-15T09:30:00Z'),
    });

    mockValidateIssueDataIntegrity = jest.fn().mockResolvedValue({
      isValid: true,
      violationDetails: undefined,
    });

    jest.doMock('../../src/logic/issue-data-persistence', () => ({
      encryptReportData: mockEncryptReportData,
      recordIssueAuditLog: mockRecordIssueAuditLog,
      validateIssueDataIntegrity: mockValidateIssueDataIntegrity,
      saveExtractedIssueData: saveExtractedIssueData,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    consoleWarnSpy.mockRestore();
  });

  // SCEN-577
  test('should save extracted issue data with empty analysis metadata and emit warning', async () => {
    const input: SaveExtractedIssueDataInput = {
      reportId: 'report-001',
      issueContent: 'データベース接続エラーが頻発',
      issueType: '技術的課題',
      priorityScore: 85,
      impactLevel: '高',
      extractedKeywords: ['データベース', '接続', 'エラー'],
      analysisResult: {
        metadata: {},
      },
      executorId: 'user-pm-001',
    };

    const result: SaveExtractedIssueDataOutput = await saveExtractedIssueData(input);

    expect(result.encryptionStatus).toBe('encrypted');
    expect(result.issueDataId).toBeDefined();
    expect(typeof result.issueDataId).toBe('string');
    expect(result.issueDataId.length).toBeGreaterThan(0);
    expect(result.savedTimestamp).toBeDefined();
    expect(typeof result.savedTimestamp).toBe('string');
    const savedDate = new Date(result.savedTimestamp);
    expect(savedDate.toISOString()).toBe(result.savedTimestamp);

    expect(mockRecordIssueAuditLog).toHaveBeenCalled();
    const auditLogCall = mockRecordIssueAuditLog.mock.calls[0];
    expect(auditLogCall[0]).toEqual({});

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('分析結果にメタデータが含まれていません。記録は続行されます')
    );

    expect(mockEncryptReportData).toHaveBeenCalled();
    expect(mockValidateIssueDataIntegrity).toHaveBeenCalled();
  });
});