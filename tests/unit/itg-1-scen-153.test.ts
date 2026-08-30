import { updateReport } from '../../src/logic/report-persistence';
import { type UpdateReportInput } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 日報永続化', () => {
  // SCEN-153
  test('既存の日報データを更新し、変更履歴と更新時刻を記録する - 指定されたreportIdに対応する日報が存在しない場合', async () => {
    const nonExistentReportId = '00000000-0000-0000-0000-000000000000';
    const updaterId = 'user-001';

    const input: UpdateReportInput = {
      reportId: nonExistentReportId,
      updaterId: updaterId,
      yesterdayPerformance: null,
      todayPlan: null,
      issuesAndConcerns: null,
      priorityLevel: null,
      attachmentIds: null,
    };

    const expectedErrorMessage = `日報が見つかりません（reportId: ${nonExistentReportId}）`;

    await expect(() => updateReport(input)).rejects.toThrow(/日報が見つかりません/);
  });
});