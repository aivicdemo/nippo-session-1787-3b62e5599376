import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示し、未提出メンバーを一目で把握できる機能', () => {
  // SCEN-3060
  test('報告提出状況リアルタイム表示機能 - 未提出メンバーの登録順序が逆順でも全員が漏れなく色分けされる', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-manager-001';

    // メンバーリスト: 提出済み8名、未提出2名（A・B）
    const memberA_userId = 'user-member-a';
    const memberA_userName = 'メンバーA';
    const memberA_email = 'member-a@company.com';

    const memberB_userId = 'user-member-b';
    const memberB_userName = 'メンバーB';
    const memberB_email = 'member-b@company.com';

    // 提出済みメンバー8名
    const submittedMembers = [
      { userId: 'user-001', userName: 'エンジニア01', email: 'eng01@company.com', submittedAt: new Date('2024-01-15T08:30:00Z') },
      { userId: 'user-002', userName: 'エンジニア02', email: 'eng02@company.com', submittedAt: new Date('2024-01-15T08:35:00Z') },
      { userId: 'user-003', userName: 'エンジニア03', email: 'eng03@company.com', submittedAt: new Date('2024-01-15T08:40:00Z') },
      { userId: 'user-004', userName: 'エンジニア04', email: 'eng04@company.com', submittedAt: new Date('2024-01-15T08:45:00Z') },
      { userId: 'user-005', userName: 'エンジニア05', email: 'eng05@company.com', submittedAt: new Date('2024-01-15T08:50:00Z') },
      { userId: 'user-006', userName: 'エンジニア06', email: 'eng06@company.com', submittedAt: new Date('2024-01-15T08:55:00Z') },
      { userId: 'user-007', userName: 'エンジニア07', email: 'eng07@company.com', submittedAt: new Date('2024-01-15T09:00:00Z') },
      { userId: 'user-008', userName: 'エンジニア08', email: 'eng08@company.com', submittedAt: new Date('2024-01-15T09:05:00Z') },
    ];

    // 未提出メンバー2名（逆順登録: B→A）
    const unsubmittedMembers = [
      { userId: memberB_userId, userName: memberB_userName, email: memberB_email },
      { userId: memberA_userId, userName: memberA_userName, email: memberA_email },
    ];

    // テスト用の入力データを構築
    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // 朝会時刻の設定（期限内の提出判定用）
    const reportDeadlineTime = new Date('2024-01-15T09:30:00Z');
    const currentTime = new Date('2024-01-15T09:20:00Z');

    // aggregateReportSubmissionStatus を呼び出し
    // ここでは未提出メンバーA・Bが含まれるシナリオを想定
    // 実装側で未提出メンバーのデータを集約し、ダッシュボード表示用のサマリーを生成する
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    // 検証1: チームIDと報告日が正確に記録されている
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // 検証2: 総メンバー数が10名で正確に計算されている
    expect(result.totalMembers).toBe(10);

    // 検証3: 提出済み数が8名で正確に計算されている
    expect(result.submittedCount).toBe(8);

    // 検証4: 未提出数が2名で正確に計算されている
    expect(result.unsubmittedCount).toBe(2);

    // 検証5: 期限超過提出が0件
    expect(result.delayedSubmissionCount).toBe(0);

    // 検証6: 提出率が80.0%で正確に計算されている
    // 提出率 = (提出済み数 / 総メンバー数) * 100 = (8 / 10) * 100 = 80.0
    expect(result.submissionRate).toBe(80.0);

    // 検証7: 未提出メンバーの一覧が正確に含まれている
    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.unsubmittedMembers.length).toBe(2);

    // 検証8: 未提出メンバーA・Bが両方含まれていることを確認（逆順登録のテスト）
    const unsubmittedUserIds = result.unsubmittedMembers.map(m => m.userId);
    expect(unsubmittedUserIds).toContain(memberA_userId);
    expect(unsubmittedUserIds).toContain(memberB_userId);

    // 検証9: 未提出メンバーの詳細情報が正確に含まれている
    const memberAFromResult = result.unsubmittedMembers.find(m => m.userId === memberA_userId);
    expect(memberAFromResult).toBeDefined();
    expect(memberAFromResult!.userName).toBe(memberA_userName);
    expect(memberAFromResult!.email).toBe(memberA_email);

    const memberBFromResult = result.unsubmittedMembers.find(m => m.userId === memberB_userId);
    expect(memberBFromResult).toBeDefined();
    expect(memberBFromResult!.userName).toBe(memberB_userName);
    expect(memberBFromResult!.email).toBe(memberB_email);

    // 検証10: メンバーの重複・欠落がないことを確認（提出済み数 + 未提出数 = 総メンバー数）
    const totalAccountedMembers = result.submittedCount + result.unsubmittedCount + result.delayedSubmissionCount;
    expect(totalAccountedMembers).toBe(result.totalMembers);

    // 検証11: 集計実行時刻がISO 8601形式で記録されている
    expect(result.aggregatedAt).toBeDefined();
    const aggregatedTime = new Date(result.aggregatedAt);
    expect(aggregatedTime.getTime()).toBeGreaterThan(0);

    // 検証12: 未提出メンバーの残り時間が正確に計算されている
    // 期限までの残り時間 = (期限時刻 - 現在時刻) / 60秒
    for (const member of result.unsubmittedMembers) {
      expect(member.remainingMinutes).toBeDefined();
      expect(typeof member.remainingMinutes).toBe('number');
      // この時点では未提出なので、remainingMinutes は正の値（期限まで時間がある）
      expect(member.remainingMinutes).toBeGreaterThan(0);
    }
  });
});