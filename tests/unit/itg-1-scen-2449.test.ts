import { describe, it, expect, beforeEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('月次パフォーマンス分析 - 監査ログ記録機能', () => {
  // SCEN-2449: [error] 分析結果監査ログ記録機能 - 前回との変更点がnullのとき、監査ログ記録が失敗する
  it('should throw error when previous analysis diff is null during audit log recording', () => {
    const reportId = 'report-2024-12-001';
    const approvalStatus = 'approved';
    const approverUserId = 'user-director-001';
    const currentAnalysisResult = {
      reportId: reportId,
      approvalStatus: approvalStatus,
      processedAt: new Date('2024-12-15T10:30:00Z'),
      nextAction: 'proceed_to_management_report' as const,
      analysisMetrics: {
        teamId: 'team-A',
        issueResolutionSpeed: 3.5,
        reportSubmissionRate: 92,
        issueRecurrenceRate: 15,
        priorityScore: 78,
      },
    };

    const previousAnalysisResult = {
      reportId: reportId,
      approvalStatus: 'pending',
      processedAt: new Date('2024-12-14T09:00:00Z'),
      nextAction: 'proceed_to_management_report' as const,
      analysisMetrics: {
        teamId: 'team-A',
        issueResolutionSpeed: 4.2,
        reportSubmissionRate: 85,
        issueRecurrenceRate: 22,
        priorityScore: 71,
      },
    };

    const auditLogRepository = {
      save: jest.fn().mockImplementation(() => {
        throw new Error('変更点がnull');
      }),
    };

    const analyticsService = {
      fetchPreviousAnalysis: jest
        .fn()
        .mockResolvedValue(previousAnalysisResult),
      calculateDiff: jest.fn().mockReturnValue(null),
    };

    const input = {
      reportId: reportId,
      approvalStatus: approvalStatus,
      rejectionReason: undefined,
      approverUserId: approverUserId,
      currentAnalysis: currentAnalysisResult,
      previousAnalysis: previousAnalysisResult,
      auditLogRepository: auditLogRepository,
      analyticsService: analyticsService,
    };

    expect(() => {
      validateMonthlyReportApproval(input);
    }).toThrow(/変更点/);

    expect(auditLogRepository.save).toHaveBeenCalled();
  });
});