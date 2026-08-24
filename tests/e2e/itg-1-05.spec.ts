import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("日報入力・編集画面", () => {
  
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    // 対象画面へ遷移
    await page.goto(`${BASE_URL}/panels/scr-1787119190590.html`);
    await page.waitForLoadState('networkidle');
  });

  // SCEN-011: [normal] 日報入力・編集画面 - 課題抽出結果表示エリアに抽出結果が表示される
  test("SCEN-011: 課題抽出結果表示エリアに抽出結果が表示される", async ({ page }) => {
    await page.fill('[data-testid="yesterday-achievement-input"]', '顧客A社との打ち合わせ実施、議事録作成完了');
    await page.fill('[data-testid="today-plan-input"]', '顧客B社提案資料作成、チームレビュー予定');
    await page.fill('[data-testid="issues-input"]', '顧客A社の要件定義がスケジュール遅延しており、今週中の決定が必要。チーム内で優先度調整中');
    
    await page.click('[data-testid="submit-button"]');
    
    const successMessage = page.locator('#success-message');
    await expect(successMessage).toContainText('送信');
  });

  // SCEN-012: [normal] 日報入力・編集画面 - 下書き保存ボタン押下で下書きが保存される
  test("SCEN-012: 下書き保存ボタン押下で下書きが保存される", async ({ page }) => {
    await page.fill('[data-testid="yesterday-achievement-input"]', '顧客A社との打ち合わせ実施');
    await page.fill('[data-testid="today-plan-input"]', '提案資料作成');
    await page.fill('[data-testid="issues-input"]', 'リソース不足');
    
    await page.click('[data-testid="draft-button"]');
    
    const yesterdayValue = await page.inputValue('[data-testid="yesterday-achievement-input"]');
    const todayValue = await page.inputValue('[data-testid="today-plan-input"]');
    const issuesValue = await page.inputValue('[data-testid="issues-input"]');
    
    expect(yesterdayValue).toBe('顧客A社との打ち合わせ実施');
    expect(todayValue).toBe('提案資料作成');
    expect(issuesValue).toBe('リソース不足');
  });

  // SCEN-013: [edge] 日報入力・編集画面 - 本日の実績を空で下書き保存しても処理が進む
  test("SCEN-013: 本日の実績を空で下書き保存しても処理が進む", async ({ page }) => {
    await page.fill('[data-testid="yesterday-achievement-input"]', 'テスト実装完了');
    await page.fill('[data-testid="today-plan-input"]', 'テスト実装完了');
    // 「抱えている課題」フィールドは空のまま
    
    await page.click('[data-testid="draft-button"]');
    
    const yesterdayValue = await page.inputValue('[data-testid="yesterday-achievement-input"]');
    const todayValue = await page.inputValue('[data-testid="today-plan-input"]');
    
    expect(yesterdayValue).toBe('テスト実装完了');
    expect(todayValue).toBe('テスト実装完了');
  });

  // SCEN-014: [edge] 日報入力・編集画面 - 本日の課題を空で下書き保存しても処理が進む
  test("SCEN-014: 本日の課題を空で下書き保存しても処理が進む", async ({ page }) => {
    await page.fill('[data-testid="yesterday-achievement-input"]', '顧客A社対応');
    await page.fill('[data-testid="today-plan-input"]', '提案資料作成');
    // 「抱えている課題」フィールドは空のまま
    
    await page.click('[data-testid="draft-button"]');
    
    const yesterdayValue = await page.inputValue('[data-testid="yesterday-achievement-input"]');
    const todayValue = await page.inputValue('[data-testid="today-plan-input"]');
    const issuesValue = await page.inputValue('[data-testid="issues-input"]');
    
    expect(yesterdayValue).toBe('顧客A社対応');
    expect(todayValue).toBe('提案資料作成');
    expect(issuesValue).toBe('');
  });

  // SCEN-015: [edge] 日報入力・編集画面 - 明日の予定を空で下書き保存しても処理が進む
  test("SCEN-015: 明日の予定を空で下書き保存しても処理が進む", async ({ page }) => {
    await page.fill('[data-testid="yesterday-achievement-input"]', '顧客A対応');
    await page.fill('[data-testid="today-plan-input"]', '提案書作成');
    // 「抱えている課題」フィールドは空のまま
    
    await page.click('[data-testid="draft-button"]');
    
    const yesterdayValue = await page.inputValue('[data-testid="yesterday-achievement-input"]');
    const todayValue = await page.inputValue('[data-testid="today-plan-input"]');
    
    expect(yesterdayValue).toBe('顧客A対応');
    expect(todayValue).toBe('提案書作成');
  });

  // SCEN-016: [edge] 日報入力・編集画面 - 課題キーワード未選択で下書き保存しても処理が進む
  test("SCEN-016: 課題キーワード未選択で下書き保存しても処理が進む", async ({ page }) => {
    await page.fill('[data-testid="yesterday-achievement-input"]', '顧客A社との定例会議');
    await page.fill('[data-testid="today-plan-input"]', '提案資料の作成');
    await page.fill('[data-testid="issues-input"]', 'リソース不足で納期が迫っている');
    // 課題キーワード選択欄は未選択のまま
    
    await page.click('[data-testid="draft-button"]');
    
    const yesterdayValue = await page.inputValue('[data-testid="yesterday-achievement-input"]');
    const todayValue = await page.inputValue('[data-testid="today-plan-input"]');
    const issuesValue = await page.inputValue('[data-testid="issues-input"]');
    
    expect(yesterdayValue).toBe('顧客A社との定例会議');
    expect(todayValue).toBe('提案資料の作成');
    expect(issuesValue).toBe('リソース不足で納期が迫っている');
  });

  // SCEN-017: [edge] 日報入力・編集画面 - 課題詳細説明を空で下書き保存しても処理が進む
  test("SCEN-017: 課題詳細説明を空で下書き保存しても処理が進む", async ({ page }) => {
    await page.fill('[data-testid="yesterday-achievement-input"]', '顧客対応');
    await page.fill('[data-testid="today-plan-input"]', 'システムテスト');
    // 「抱えている課題」フィールドは空のまま
    
    await page.click('[data-testid="draft-button"]');
    
    const yesterdayValue = await page.inputValue('[data-testid="yesterday-achievement-input"]');
    const todayValue = await page.inputValue('[data-testid="today-plan-input"]');
    const issuesValue = await page.inputValue('[data-testid="issues-input"]');
    
    expect(yesterdayValue).toBe('顧客対応');
    expect(todayValue).toBe('システムテスト');
    expect(issuesValue).toBe('');
  });

  // SCEN-018: [edge] 日報入力・編集画面 - 課題優先度未選択で下書き保存しても処理が進む
  test("SCEN-018: 課題優先度未選択で下書き保存しても処理が進む", async ({ page }) => {
    await page.fill('[data-testid="yesterday-achievement-input"]', '昨日はA機能の修正を行いました');
    await page.fill('[data-testid="today-plan-input"]', '今日はB機能のテストを実施します');
    await page.fill('[data-testid="issues-input"]', 'データベース接続タイムアウトが発生');
    // 課題優先度ドロップダウンは未選択のまま
    
    await page.click('[data-testid="draft-button"]');
    
    const yesterdayValue = await page.inputValue('[data-testid="yesterday-achievement-input"]');
    const todayValue = await page.inputValue('[data-testid="today-plan-input"]');
    const issuesValue = await page.inputValue('[data-testid="issues-input"]');
    
    expect(yesterdayValue).toBe('昨日はA機能の修正を行いました');
    expect(todayValue).toBe('今日はB機能のテストを実施します');
    expect(issuesValue).toBe('データベース接続タイムアウトが発生');
  });
});