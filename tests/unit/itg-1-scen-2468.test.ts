import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題優先度スコア記録と監査ログ機能', () => {
  // SCEN-2468: [edge] 分析結果監査ログ記録機能 - 前回との変更点が複数件の差分データを含む場合に順序を保持して記録される
  test('should record multiple keyword changes with order preservation and difference type tracking', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Setup: Mock previous analysis state
    const previousKeywords = [
      { keyword: 'API障害', frequency: 5, confidence: 0.92 },
      { keyword: 'ユーザー報告', frequency: 3, confidence: 0.85 },
      { keyword: '対応中', frequency: 2, confidence: 0.78 },
    ];

    // Setup: Mock new analysis state with multiple changes
    const newKeywords = [
      { keyword: 'API障害', frequency: 6, confidence: 0.95 },
      { keyword: '新規不具合', frequency: 4, confidence: 0.88 },
      { keyword: '緊急対応', frequency: 5, confidence: 0.91 },
      { keyword: 'ユーザー報告', frequency: 2, confidence: 0.82 },
    ];

    mockTextAnalysisAdapter.extractKeywords
      .mockResolvedValueOnce(previousKeywords)
      .mockResolvedValueOnce(newKeywords);

    mockTextAnalysisAdapter.assessImpactScore.mockResolvedValue({
      impactScore: 75,
      affectedTeams: 3,
    });

    mockTextAnalysisAdapter.classifyIssueSeverity.mockResolvedValue('high');

    const reportId = 'report-2026-08-19-001';
    const approverUserId = 'user-manager-001';
    const fixedTimestamp = new Date('2026-08-19T10:30:45.123Z');

    const approvalInput = {
      reportId,
      approvalStatus: 'approved' as const,
      approverUserId,
    };

    const result = await validateMonthlyReportApproval(
      approvalInput,
      mockTextAnalysisAdapter,
      fixedTimestamp
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toEqual(fixedTimestamp);

    // Verify audit log structure: differences recorded in order
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThan(0);

    // Validate difference tracking order preservation
    const addedDifferences = result.auditLog.filter(
      (log) => log.differenceType === 'added'
    );
    const deletedDifferences = result.auditLog.filter(
      (log) => log.differenceType === 'deleted'
    );
    const positionChangedDifferences = result.auditLog.filter(
      (log) => log.differenceType === 'position_changed'
    );

    // Expected differences: added 2 (新規不具合, 緊急対応), deleted 1 (対応中), position_changed 1 (ユーザー報告)
    expect(addedDifferences.length).toBe(2);
    expect(deletedDifferences.length).toBe(1);
    expect(positionChangedDifferences.length).toBeGreaterThanOrEqual(1);

    // Validate specific additions in order
    expect(addedDifferences[0].keyword).toBe('新規不具合');
    expect(addedDifferences[0].position).toBe(1);
    expect(addedDifferences[0].timestamp).toEqual(fixedTimestamp);
    expect(addedDifferences[0].confidence).toBe(0.88);

    expect(addedDifferences[1].keyword).toBe('緊急対応');
    expect(addedDifferences[1].position).toBe(2);
    expect(addedDifferences[1].timestamp).toEqual(fixedTimestamp);
    expect(addedDifferences[1].confidence).toBe(0.91);

    // Validate deletion
    expect(deletedDifferences[0].keyword).toBe('対応中');
    expect(deletedDifferences[0].timestamp).toEqual(fixedTimestamp);

    // Validate position change for ユーザー報告
    const userReportPositionChange = positionChangedDifferences.find(
      (log) => log.keyword === 'ユーザー報告'
    );
    expect(userReportPositionChange).toBeDefined();
    expect(userReportPositionChange?.previousPosition).toBe(1);
    expect(userReportPositionChange?.newPosition).toBe(3);
    expect(userReportPositionChange?.timestamp).toEqual(fixedTimestamp);

    // Validate audit log format: verify timestamp and correlation IDs are present
    result.auditLog.forEach((logEntry) => {
      expect(logEntry.timestamp).toEqual(fixedTimestamp);
      expect(logEntry.differenceType).toMatch(/added|deleted|position_changed/);
      expect(logEntry.correlationId).toBeDefined();
      expect(typeof logEntry.correlationId).toBe('string');
      expect(logEntry.correlationId.length).toBeGreaterThan(0);
    });

    // Validate order preservation: differences should appear in detection order
    const allDifferences = result.auditLog;
    expect(allDifferences[0].keyword).toBe('新規不具合');
    expect(allDifferences[allDifferences.length - 1].differenceType).toMatch(
      /added|deleted|position_changed/
    );

    // Verify change summary in audit log
    expect(result.auditLogSummary).toBeDefined();
    expect(result.auditLogSummary.previousState).toEqual(
      'API障害→ユーザー報告→対応中'
    );
    expect(result.auditLogSummary.currentState).toEqual(
      'API障害→新規不具合→緊急対応→ユーザー報告'
    );
    expect(result.auditLogSummary.changeCount).toBe(4);
    expect(result.auditLogSummary.changesApplied).toEqual({
      added: 2,
      deleted: 1,
      positionChanged: 1,
    });

    // Verify mockTextAnalysisAdapter was called appropriately
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});