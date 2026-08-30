import { planAdoptionSchedule } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 導入計画スケジュール策定', () => {
  // SCEN-115: [normal] 導入計画の参加者リストと最小準備期間を入力し、スケジュール策定の基準を確定する
  test('planAdoptionScheduleが代表的な正常入力を設計どおり処理する', () => {
    const participantList = [
      { role: '部長', userId: 'user-001', userName: 'Manager A' },
      { role: 'PM', userId: 'user-002', userName: 'PM B' },
      { role: 'エンジニア代表', userId: 'user-003', userName: 'Engineer C' }
    ];
    const minimumPreparationDaysInBusinessDays = 10;
    const targetAdoptionStartDate = '2026-09-15';
    const executorUserId = 'pm-user-001';

    const result = planAdoptionSchedule({
      participantList,
      minimumPreparationDaysInBusinessDays,
      targetAdoptionStartDate,
      executorUserId
    });

    // scheduleId: null以外の文字列値
    expect(typeof result.scheduleId).toBe('string');
    expect(result.scheduleId.length).toBeGreaterThan(0);

    // confirmedParticipants: 入力されたparticipantListと同じ3名
    expect(result.confirmedParticipants).toHaveLength(3);
    expect(result.confirmedParticipants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: '部長',
          userId: 'user-001',
          userName: 'Manager A'
        }),
        expect.objectContaining({
          role: 'PM',
          userId: 'user-002',
          userName: 'PM B'
        }),
        expect.objectContaining({
          role: 'エンジニア代表',
          userId: 'user-003',
          userName: 'Engineer C'
        })
      ])
    );

    // adoptionStartDate: 入力値と一致
    expect(result.adoptionStartDate).toBe('2026-09-15');

    // calculatedPreparationEndDate: targetAdoptionStartDateから営業日ベースで10営業日遡った日付
    // 2026-09-15から営業日で10日遡ると、2026-09-01（火曜）になる想定
    expect(result.calculatedPreparationEndDate).toBe('2026-09-01');

    // milestones: 最低4つのマイルストーン
    expect(result.milestones.length).toBeGreaterThanOrEqual(4);

    // 各マイルストーンがname、scheduledDate、targetParticipantRolesフィールドを持つ
    result.milestones.forEach((milestone) => {
      expect(milestone).toHaveProperty('milestoneName');
      expect(milestone).toHaveProperty('scheduledDate');
      expect(milestone).toHaveProperty('targetParticipantRoles');
      expect(typeof milestone.milestoneName).toBe('string');
      expect(typeof milestone.scheduledDate).toBe('string');
      expect(Array.isArray(milestone.targetParticipantRoles)).toBe(true);
    });

    // マイルストーンが計画期間内に配置されていることを確認
    result.milestones.forEach((milestone) => {
      const scheduledDate = new Date(milestone.scheduledDate);
      const prepEndDate = new Date(result.calculatedPreparationEndDate);
      const adoptStartDate = new Date(result.adoptionStartDate);
      expect(scheduledDate.getTime()).toBeGreaterThanOrEqual(prepEndDate.getTime());
      expect(scheduledDate.getTime()).toBeLessThanOrEqual(adoptStartDate.getTime());
    });

    // ガイド作成、部長研修、全員研修、初回テスト報告が含まれていることを確認
    const milestoneNames = result.milestones.map((m) => m.milestoneName);
    expect(milestoneNames).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/ガイド作成|guide|Guide/i),
        expect.stringMatching(/部長研修|manager.*training|Manager.*Training/i),
        expect.stringMatching(/全員研修|engineer.*training|Engineer.*Training|group.*training/i),
        expect.stringMatching(/初回テスト報告|initial.*report|Initial.*Report/i)
      ])
    );
  });
});