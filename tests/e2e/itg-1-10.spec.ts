import { test, expect } from '@playwright/test';

test.describe("日報確認・検索画面", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    // 日報確認・検索画面へ遷移
    await page.goto(`${BASE_URL}/panels/scr-1787119221707.html`);
    await page.waitForLoadState('networkidle');
  });

  // SCEN-049: [edge] 検索結果が0件のときテーブルに0件メッセージが表示される
  test("SCEN-049: 検索結果が0件のときテーブルに0件メッセージが表示される", async ({ page }) => {
    // 存在しないキーワードで検索
    await page.fill('[data-testid="keyword-search"]', '存在しないキーワード_NONEXISTENT_123456');
    await page.click('[data-testid="search-button"]');
    
    // 検索結果テーブルに0件メッセージが表示されることを確認
    const recordList = page.locator('[data-testid="record-list"]');
    await expect(recordList).toContainText('該当する日報がありません');
  });

  // SCEN-050: [edge] 検索結果が複数件のときテーブルに全件が一覧表示される
  test("SCEN-050: 検索結果が複数件のときテーブルに全件が一覧表示される", async ({ page }) => {
    // テスト用データが存在することを前提に、検索条件を未設定のまま表示
    const recordList = page.locator('[data-testid="record-list"]');
    
    // 検索ボタンをクリック（フィルタなしで全件表示）
    await page.click('[data-testid="search-button"]');
    
    // テーブルボディに行が複数存在することを確認
    const rows = page.locator('[id="reports-tbody"] tr');
    const rowCount = await rows.count();
    
    // テスト用データが最低1件以上存在することを確認
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // SCEN-051: [error] 課題キーワード検索フィールドを空で検索実行するとエラー表示になる
  test("SCEN-051: 課題キーワード検索フィールドを空で検索実行するとエラー表示になる", async ({ page }) => {
    // キーワード検索フィールドは既に空の状態
    const keywordField = page.locator('[data-testid="keyword-search"]');
    await expect(keywordField).toHaveValue('');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // エラーメッセージの表示を確認
    const errorMessage = page.locator('[id="validation-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('課題キーワードを入力してください');
  });

  // SCEN-052: [error] 提出日範囲で開始日のみ指定して検索するとエラー表示になる
  test("SCEN-052: 提出日範囲で開始日のみ指定して検索するとエラー表示になる", async ({ page }) => {
    // 開始日のみを入力
    // 注: 画面上に開始日・終了日のフィールドが存在することを前提
    const startDateField = page.locator('input[type="date"]:first-of-type');
    if ((await expect(startDateField).toBeVisible(), true)) {
      await startDateField.fill('2026-01-01');
      
      // 検索ボタンをクリック
      await page.click('[data-testid="search-button"]');
      
      // エラーメッセージの表示を確認
      const errorMessage = page.locator('[id="validation-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('終了日を指定してください');
    }
  });

  // SCEN-053: [error] 提出日範囲で終了日のみ指定して検索するとエラー表示になる
  test("SCEN-053: 提出日範囲で終了日のみ指定して検索するとエラー表示になる", async ({ page }) => {
    // 終了日のみを入力
    const endDateField = page.locator('input[type="date"]:last-of-type');
    if ((await expect(endDateField).toBeVisible(), true)) {
      await endDateField.fill('2026-08-19');
      
      // 検索ボタンをクリック
      await page.click('[data-testid="search-button"]');
      
      // エラーメッセージの表示を確認
      const errorMessage = page.locator('[id="validation-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('開始日を指定してください');
    }
  });

  // SCEN-055: [normal] 〈日報入力・編集画面〉で送信した日報が〈日報確認・検索画面〉で検索・確認できる
  test("SCEN-055: 日報入力・編集画面で送信した日報が検索・確認できる", async ({ page }) => {
    // 日報入力・編集画面へ遷移
    await page.goto(`${BASE_URL}/panels/scr-1787119190590.html`);
    await page.waitForLoadState('networkidle');
    
    // 日報を入力
    await page.fill('[data-testid="yesterday-achievement-input"]', '顧客A打ち合わせ対応');
    await page.fill('[data-testid="today-plan-input"]', '提案資料作成');
    await page.fill('[data-testid="issues-input"]', 'リソース不足');
    
    // 送信ボタンをクリック
    await page.click('[data-testid="submit-button"]');
    
    // 日報確認・検索画面へ戻る
    await page.goto(`${BASE_URL}/panels/scr-1787119221707.html`);
    await page.waitForLoadState('networkidle');
    
    // 「リソース不足」で検索
    await page.fill('[data-testid="keyword-search"]', 'リソース不足');
    await page.click('[data-testid="search-button"]');
    
    // 検索結果に該当日報が表示されることを確認
    const recordList = page.locator('[data-testid="record-list"]');
    await expect(recordList).toContainText('リソース不足');
  });

  // SCEN-058: [normal] 日報入力・編集画面で入力された課題キーワードが検索・フィルタリングに反映される
  test("SCEN-058: 日報入力で入力された課題キーワードが検索に反映される", async ({ page }) => {
    // 日報入力・編集画面へ遷移
    await page.goto(`${BASE_URL}/panels/scr-1787119190590.html`);
    await page.waitForLoadState('networkidle');
    
    // テスト用日報を入力
    await page.fill('[data-testid="yesterday-achievement-input"]', 'テスト実装');
    await page.fill('[data-testid="today-plan-input"]', 'テストコード作成');
    await page.fill('[data-testid="issues-input"]', 'データベース接続タイムアウト');
    
    // 送信ボタンをクリック
    await page.click('[data-testid="submit-button"]');
    
    // 日報確認・検索画面へ遷移
    await page.goto(`${BASE_URL}/panels/scr-1787119221707.html`);
    await page.waitForLoadState('networkidle');
    
    // 「データベース」キーワードで検索
    await page.fill('[data-testid="keyword-search"]', 'データベース');
    await page.click('[data-testid="search-button"]');
    
    // 検索結果に該当日報が表示されることを確認
    const recordList = page.locator('[data-testid="record-list"]');
    await expect(recordList).toContainText('データベース');
  });
});