import { submitReport } from '../../src/logic/report-submission-management';

describe('Report Submission Management', () => {
  test('SCEN-300: should throw ValidationError when issuesAndConcerns is empty', () => {
    const reporterId = 'ENG001';
    const teamId = 'TEAM-A';
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const yesterdayAccomplishment = 'Completed feature development';
    const todayPlan = 'Code review and testing';
    const issuesAndConcerns = '';

    expect(() => {
      submitReport({
        reporterId,
        teamId,
        reportDate,
        yesterdayAccomplishment,
        todayPlan,
        issuesAndConcerns,
      });
    }).toThrow(/抱えている課題を入力してください/);
  });
});