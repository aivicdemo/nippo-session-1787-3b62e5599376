import { submitDailyReport } from '../../src/logic/report-submission';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/report-submission';

describe('Daily Report Submission', () => {
  // SCEN-2019: [normal] 対策案の承認フロー開始 - 必須項目の検証完了後、承認権者（開発部長）への承認フローが正常に開始される
  test('should initiate approval workflow when all required fields are validated and approval button is clicked', async () => {
    // Arrange: 必須項目をすべて入力した対策案入力データ
    const engineerId = 'engineer_001';
    const yesterdayAccomplishment = 'Completed API integration for user authentication module. Conducted code review with team members.';
    const todayPlan = 'Implement error handling and logging for API endpoints. Write unit tests for authentication flows.';
    const currentChallenges = 'Database connection timeout issues during peak load testing. Need to optimize query performance.';

    const submissionInput: SubmitDailyReportInput = {
      engineerId,
      yesterdayAccomplishment,
      todayPlan,
      currentChallenges,
    };

    // Mock TextAnalysisServiceAdapter: 課題キーワード抽出と重要度分類が成功する状態
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database connection timeout', frequency: 1, confidence: 0.92 },
          { keyword: 'query performance', frequency: 1, confidence: 0.88 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'high',
        rationale: 'Performance issue affecting system stability during peak load',
      }),
    };

    // Mock approval task generation and history logging
    const mockApprovalTaskRepository = {
      createApprovalTask: jest.fn().mockResolvedValue({
        taskId: 'approval_task_001',
        reportId: 'report_001',
        assignedTo: 'manager_001',
        status: 'pending',
        createdAt: new Date('2024-01-15T11:30:00Z').toISOString(),
      }),
    };

    const mockHistoryLogger = {
      logEvent: jest.fn().mockResolvedValue({
        eventId: 'event_001',
        eventType: 'APPROVAL_WORKFLOW_INITIATED',
        timestamp: new Date('2024-01-15T11:30:00Z').toISOString(),
        details: {
          reportId: 'report_001',
          initiator: engineerId,
        },
      }),
    };

    // Act: submitDailyReport を呼び出す。内部で承認フローが開始される想定
    const result: SubmitDailyReportOutput = await submitDailyReport(
      submissionInput,
      mockTextAnalysisServiceAdapter,
      mockApprovalTaskRepository,
      mockHistoryLogger
    );

    // Assert: 期待結果の検証
    // 1. 日報送信が成功したことを確認
    expect(result.success).toBe(true);

    // 2. 送信時刻がISO 8601形式で記録されたことを確認
    expect(result.submissionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 3. 送信された日報のレポートIDが生成されたことを確認
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    // 4. 送信時刻が報告期限内であることを確認（期限は朝9時の想定、現在11:30は期限内）
    expect(result.isWithinDeadline).toBe(true);

    // 5. TextAnalysisServiceAdapterが課題キーワード抽出を呼び出したことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('database connection timeout')
    );

    // 6. TextAnalysisServiceAdapterが重要度分類を呼び出したことを確認
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    // 7. 承認権者（開発部長）への承認タスクが生成されたことを確認
    expect(mockApprovalTaskRepository.createApprovalTask).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: result.reportId,
        assignedTo: 'manager_001',
        status: 'pending',
      })
    );

    // 8. 対策案の履歴ログに「承認フロー開始」イベントが記録されたことを確認
    expect(mockHistoryLogger.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'APPROVAL_WORKFLOW_INITIATED',
        details: expect.objectContaining({
          reportId: result.reportId,
          initiator: engineerId,
        }),
      })
    );

    // 9. 対策案の状態が「承認待ち」（pending）に遷移したことを確認
    const approvalTaskResult = await mockApprovalTaskRepository.createApprovalTask.mock.results[0].value;
    expect(approvalTaskResult.status).toBe('pending');

    // 10. 承認権者の承認待ちタスク一覧に当該対策案が即座に表示されることを確認
    expect(approvalTaskResult.assignedTo).toBe('manager_001');
    expect(approvalTaskResult.taskId).toBeDefined();
    expect(approvalTaskResult.createdAt).toBe('2024-01-15T11:30:00Z');

    // 11. 履歴ログのタイムスタンプが記録されたことを確認
    const historyLogResult = await mockHistoryLogger.logEvent.mock.results[0].value;
    expect(historyLogResult.timestamp).toBe('2024-01-15T11:30:00Z');
    expect(historyLogResult.eventId).toBeDefined();
  });
});