import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('Report Submission Management - getSubmissionStatus', () => {
  // SCEN-633: [error] チームメンバーIDが空のリストまたはnullのときエラーをスロー
  test('should throw error when teamMemberIds is null', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requesterId = 'user-manager-001';
    const teamMemberIds = null as any;

    expect(() => {
      getSubmissionStatus(
        teamId,
        reportDate,
        requesterId,
        teamMemberIds
      );
    }).toThrow(/チームメンバー情報が取得できません/);
  });
});