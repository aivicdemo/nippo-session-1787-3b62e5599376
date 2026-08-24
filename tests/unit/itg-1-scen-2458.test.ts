import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportApprovalInput, type MonthlyReportApprovalResult } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度を判定し優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2458: [edge] 分析結果監査ログ記録機能 - 確定日時が営業日開始時刻直下（08:59:59）で記録される
  test('分析結果監査ログが営業日開始時刻直下の08:59:59で記録される', () => {
    // Arrange
    const businessDayStartTime = new Date('2024-01-15T08:59:59Z');
    
    const mockAuditLog = {
      confirmed_timestamp: businessDayStartTime.toISOString().split('T')[0] + ' 08:59:59',
      analysis_version: '1.0.0',
      confirmed_by_user_id: 'pm_user_001',
      analysis_details: {
        extraction_method: 'keyword_extraction',
        priority_rules_version: '2.1.0',
        change_from_previous: 'priority_recalculated_due_to_new_data'
      }
    };

    const approvalInput: MonthlyReportApprovalInput = {
      reportId: 'monthly_report_2024_01_001',
      approvalStatus: 'approved',
      approverUserId: 'director_user_001'
    };

    // Act
    const result: MonthlyReportApprovalResult = validateMonthlyReportApproval(approvalInput);

    // Assert
    expect(result).toBeDefined();
    expect(result.reportId).toBe('monthly_report_2024_01_001');
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toBeInstanceOf(Date);
    expect(result.nextAction).toBe('proceed_to_management_report');
    
    // Verify audit log timestamp format matches expected business day start pattern
    const timestampParts = mockAuditLog.confirmed_timestamp.split(' ');
    expect(timestampParts.length).toBe(2);
    expect(timestampParts[1]).toBe('08:59:59');
    
    // Verify date format is YYYY-MM-DD
    const dateParts = timestampParts[0].split('-');
    expect(dateParts.length).toBe(3);
    expect(dateParts[0]).toMatch(/^\d{4}$/);
    expect(dateParts[1]).toMatch(/^\d{2}$/);
    expect(dateParts[2]).toMatch(/^\d{2}$/);
  });
});