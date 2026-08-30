import { submitReport } from '../../src/logic/report-submission-management';

describe('submitReport', () => {
  test('SCEN-037: エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する', () => {
    const reporterId = 'ENG001';
    const teamId = 'TEAM-A';
    const reportDate = new Date('2026-08-19');
    const yesterdayAccomplishment = '昨日のタスクを完了した';
    const todayPlan = '今日の予定を実行する';
    const issuesAndConcerns = '懸念事項を確認中';

    const mockSubmissionTimestamp = new Date('2026-08-19T08:30:00.000Z');
    const mockMorningMeetingStartTime = new Date('2026-08-19T09:00:00.000Z');
    const mockReportId = 'RPT20260819001';

    const validateReportSubmissionStub = jest.fn().mockReturnValue(undefined);
    const saveReportStub = jest.fn().mockReturnValue(mockReportId);
    const getReportSubmissionTimestampStub = jest.fn().mockReturnValue(mockSubmissionTimestamp);
    const getDeadlineStub = jest.fn().mockReturnValue(mockMorningMeetingStartTime);

    const result = submitReport(
      {
        reporterId,
        teamId,
        reportDate,
        yesterdayAccomplishment,
        todayPlan,
        issuesAndConcerns,
      },
      {
        validateReportSubmission: validateReportSubmissionStub,
        saveReport: saveReportStub,
        getReportSubmissionTimestamp: getReportSubmissionTimestampStub,
        getDeadline: getDeadlineStub,
      }
    );

    const expectedRemainingTimeToDeadline = 30;
    const expectedSubmissionStatus = 'submitted';

    expect(result.reportId).toBe('RPT20260819001');
    expect(result.submissionStatus).toBe(expectedSubmissionStatus);
    expect(result.submissionTimestamp).toEqual(mockSubmissionTimestamp);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.remainingTimeToDeadline).toBe(expectedRemainingTimeToDeadline);

    expect(validateReportSubmissionStub).toHaveBeenCalledWith({
      reporterId,
      teamId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
    });

    expect(saveReportStub).toHaveBeenCalledWith({
      reporterId,
      teamId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
      submissionTimestamp: mockSubmissionTimestamp,
    });

    expect(getReportSubmissionTimestampStub).toHaveBeenCalled();
    expect(getDeadlineStub).toHaveBeenCalledWith(teamId, reportDate);
  });
});