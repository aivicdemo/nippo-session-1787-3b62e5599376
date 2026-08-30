import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信処理', () => {
  // SCEN-193: [normal] エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する
  test('日報送信時に送信時刻記録と期限判定が正確に機能し、期限超過時に遅延ステータスが返される', () => {
    // Arrange
    const reporterId = 'ENG-001';
    const teamId = 'TEAM-A';
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const yesterdayAccomplishment = '昨日の成果';
    const todayPlan = '今日の予定';
    const issuesAndConcerns = '懸念事項';
    
    // 朝会開始時刻: 09:00、送信時刻: 09:30（30分遅延）
    const morningMeetingStartTime = '09:00';
    const submissionTimestamp = new Date('2024-01-15T09:30:00Z');
    
    // Act
    const result = submitReport({
      reporterId,
      teamId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
      submissionTimestamp,
    });
    
    // Assert - 期限判定：朝会開始09:00に対して09:30送信のため期限超過
    expect(result.submissionStatus).toBe('delayed');
    expect(result.isWithinDeadline).toBe(false);
    
    // Assert - 残り時間：09:00 - 09:30 = -30分（30分超過）
    expect(result.remainingTimeToDeadline).toBe(-30);
    
    // Assert - 基本的な戻り値の構造を検証
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toEqual(submissionTimestamp);
  });
});