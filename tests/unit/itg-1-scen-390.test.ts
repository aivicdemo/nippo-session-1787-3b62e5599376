import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-390: [error] 課題カテゴリ定義が未設定のときに「課題カテゴリ定義が見つかりません。管理者に連絡してください」エラーを発生させる
  test('カテゴリ定義が空配列のとき、エラーをスロー', () => {
    const extractedChallenges = [
      {
        text: '設計レビュー遅延',
        frequency: 5,
        affectedMembers: ['member1', 'member2', 'member3'],
      },
    ];

    const categoryDefinitions: any[] = [];

    const priorityWeights = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() =>
      calculatePriorityScoreForIssue(
        extractedChallenges,
        categoryDefinitions,
        priorityWeights
      )
    ).toThrow(/課題カテゴリ定義が見つかりません/);
  });
});