import { getSubmissionStatus } from '../../src/logic/report-submission-management';
import type { SubmissionStatusQueryInput } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 報告提出状況管理', () => {
  // SCEN-620: [error] チームメンバーリストが空のときチームメンバー情報が登録されていません
  test('should throw error when team member list is empty', async () => {
    const input: SubmissionStatusQueryInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requesterId: 'user-manager-001',
    };

    await expect(() => getSubmissionStatus(input)).rejects.toThrow(/チームメンバー情報/);
  });
});