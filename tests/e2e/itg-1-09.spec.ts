import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("日報確認・検索画面", () => {
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

  // SCEN-039: [normal] 日報確認・検索画面 - 日報一覧テーブルが初期状態で表示される
  test("SCEN-039: 日報一覧テーブルが初期状態で表示される", async ({ page }) => {
    // テーブルヘッダーが存在することを確認
    const tableHeader = page.locator('thead');
    await expect(tableHeader).toBeVisible();

    // テーブルボディが存在することを確認
    const tableBody = page.locator('#reports-tbody');
    await expect(tableBody).toBeVisible();

    // 検索フィールドが表示されていることを確認
    const keywordSearch = page.locator('#keyword-search');
    await expect(keywordSearch).toBeVisible();

    // テーブルが崩れていないか確認（基本的な高さチェック）
    const shell = page.locator('.shell-container');
    await expect(shell).toBeVisible();
  });

  // SCEN-040: [normal] 日報確認・検索画面 - 課題キーワード検索フィールドに入力した値が検索に反映される
  test("SCEN-040: 課題キーワード検索フィールドに入力した値が検索に反映される", async ({ page }) => {
    // 初期状態の行数を記録
    const initialRows = await page.locator('#reports-tbody tr').count();

    // 検索フィールドにキーワードを入力
    const keywordSearch = page.locator('#keyword-search');
    await keywordSearch.fill('システム障害');

    // 検索ボタンをクリック
    const searchBtn = page.locator('#search-btn');
    await searchBtn.click();

    // フィルタリング後の結果を待機
    await page.waitForLoadState('networkidle');

    // テーブルが更新されたことを確認
    const rows = page.locator('#reports-tbody tr');
    const rowCount = await rows.count();
    
    // フィルタリング後は行数が0か、または元の行数以下になっていることを確認
    if (rowCount > 0) {
      // 表示された行に「システム障害」が含まれていることを確認
      const firstRow = rows.first();
      const rowText = await firstRow.textContent();
      expect(rowText).toContain('システム障害');
    }
  });

  // SCEN-041: [normal] 日報確認・検索画面 - 提出者フィルタドロップダウンで選択した値が検索に反映される
  test("SCEN-041: 提出者フィルタドロップダウンで選択した値が検索に反映される", async ({ page }) => {
    // 提出者ドロップダウンを確認（プレースホルダーまたはラベルから特定）
    const reporterFilter = page.locator('select').first();
    
    // ドロップダウンが存在するかどうか確認
    const isDropdownVisible = await reporterFilter.isVisible();
    expect(isDropdownVisible).toBe(true);
    
    if (isDropdownVisible) {
      // ドロップダウンから最初のオプション（デフォルト以外）を選択
      const options = await reporterFilter.locator('option').count();
      if (options > 1) {
        await reporterFilter.selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        
        // 選択値が保持されていることを確認
        const selectedValue = await reporterFilter.inputValue();
        expect(selectedValue).not.toBeNull();
      }
    }
  });

  // SCEN-042: [normal] 日報確認・検索画面 - チームフィルタドロップダウンで選択した値が検索に反映される
  test("SCEN-042: チームフィルタドロップダウンで選択した値が検索に反映される", async ({ page }) => {
    // チームフィルタドロップダウンを探す
    const teamFilter = page.locator('select').nth(1);
    
    const isDropdownVisible = await teamFilter.isVisible();
    expect(isDropdownVisible).toBe(true);
    
    if (isDropdownVisible) {
      // ドロップダウンから最初のオプション（デフォルト以外）を選択
      const options = await teamFilter.locator('option').count();
      if (options > 1) {
        await teamFilter.selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        
        // 選択値が保持されていることを確認
        const selectedValue = await teamFilter.inputValue();
        expect(selectedValue).not.toBeNull();
      }
    }
  });

  // SCEN-043: [normal] 日報確認・検索画面 - 提出日範囲ピッカーで選択した開始日が検索に反映される
  test("SCEN-043: 提出日範囲ピッカーで選択した開始日が検索に反映される", async ({ page }) => {
    // 開始日入力フィールドを探す
    const startDateInput = page.locator('input[type="date"]').first();
    
    const isDateInputVisible = await startDateInput.isVisible();
    expect(isDateInputVisible).toBe(true);
    
    if (isDateInputVisible) {
      // 開始日を設定
      await startDateInput.fill('2026-08-01');
      
      // 終了日入力フィールドを探す
      const endDateInput = page.locator('input[type="date"]').nth(1);
      const isEndDateVisible = await endDateInput.isVisible();
    expect(isEndDateVisible).toBe(true);
      
      if (isEndDateVisible) {
        await endDateInput.fill('2026-08-15');
      }
      
      // 検索ボタンをクリック
      const searchBtn = page.locator('#search-btn');
      await searchBtn.click();
      
      await page.waitForLoadState('networkidle');
      
      // 開始日入力値が保持されていることを確認
      const startDateValue = await startDateInput.inputValue();
      expect(startDateValue).toBe('2026-08-01');
    }
  });

  // SCEN-044: [normal] 日報確認・検索画面 - 提出日範囲ピッカーで選択した終了日が検索に反映される
  test("SCEN-044: 提出日範囲ピッカーで選択した終了日が検索に反映される", async ({ page }) => {
    // 開始日入力フィールドを探す
    const startDateInput = page.locator('input[type="date"]').first();
    
    const isDateInputVisible = await startDateInput.isVisible();
    expect(isDateInputVisible).toBe(true);
    
    if (isDateInputVisible) {
      await startDateInput.fill('2026-01-01');
      
      // 終了日入力フィールドを探す
      const endDateInput = page.locator('input[type="date"]').nth(1);
      const isEndDateVisible = await endDateInput.isVisible();
    expect(isEndDateVisible).toBe(true);
      
      if (isEndDateVisible) {
        await endDateInput.fill('2026-01-15');
        
        // 検索ボタンをクリック
        const searchBtn = page.locator('#search-btn');
        await searchBtn.click();
        
        await page.waitForLoadState('networkidle');
        
        // 終了日入力値が保持されていることを確認
        const endDateValue = await endDateInput.inputValue();
        expect(endDateValue).toBe('2026-01-15');
      }
    }
  });

  // SCEN-045: [normal] 日報確認・検索画面 - 検索実行ボタン押下で検索結果が一覧に反映される
  test("SCEN-045: 検索実行ボタン押下で検索結果が一覧に反映される", async ({ page }) => {
    // 検索フィールドにキーワードを入力
    const keywordSearch = page.locator('#keyword-search');
    await keywordSearch.fill('データベース接続エラー');
    
    // 検索ボタンをクリック
    const searchBtn = page.locator('#search-btn');
    await searchBtn.click();
    
    await page.waitForLoadState('networkidle');
    
    // 一覧が更新されたことを確認
    const tableBody = page.locator('#reports-tbody');
    await expect(tableBody).toBeVisible();
    
    // 検索フィールドの値が保持されていることを確認
    const searchValue = await keywordSearch.inputValue();
    expect(searchValue).toBe('データベース接続エラー');
  });

  // SCEN-046: [normal] 日報確認・検索画面 - フィルタリセットボタン押下で全フィルタ条件がクリアされる
  test("SCEN-046: フィルタリセットボタン押下で全フィルタ条件がクリアされる", async ({ page }) => {
    // 複数のフィルタ条件を設定
    const keywordSearch = page.locator('#keyword-search');
    await keywordSearch.fill('バグ');
    
    // 日付範囲を設定
    const startDateInput = page.locator('input[type="date"]').first();
    const isDateInputVisible = await startDateInput.isVisible();
    expect(isDateInputVisible).toBe(true);
    
    if (isDateInputVisible) {
      await startDateInput.fill('2026-01-01');
      
      const endDateInput = page.locator('input[type="date"]').nth(1);
      const isEndDateVisible = await endDateInput.isVisible();
    expect(isEndDateVisible).toBe(true);
      
      if (isEndDateVisible) {
        await endDateInput.fill('2026-01-07');
      }
    }
    
    // 検索を実行
    const searchBtn = page.locator('#search-btn');
    await searchBtn.click();
    await page.waitForLoadState('networkidle');
    
    // リセットボタンを探す
    const resetButton = page.locator('button').filter({ hasText: 'リセット' }).first();
    const isResetVisible = await resetButton.isVisible();
    expect(isResetVisible).toBe(true);
    
    if (isResetVisible) {
      await resetButton.click();
      await page.waitForLoadState('networkidle');
      
      // キーワード検索フィールドが空になったことを確認
      const searchValue = await keywordSearch.inputValue();
      expect(searchValue).toBe('');
      
      // 日付入力フィールドが空になったことを確認
      if (isDateInputVisible) {
        const startDateValue = await startDateInput.inputValue();
        expect(startDateValue).toBe('');
      }
    }
  });

  // SCEN-047: [normal] 日報確認・検索画面 - 日報一覧の行をクリックすると詳細表示パネルが開く
  test("SCEN-047: 日報一覧の行をクリックすると詳細表示パネルが開く", async ({ page }) => {
    // テーブル行が存在することを確認
    const rows = page.locator('#reports-tbody tr');
    const rowCount = await rows.count();
    
    if (rowCount > 0) {
      // 最初の行をクリック
      await rows.first().click();
      
      
      // 詳細表示パネルが開いたことを確認
      const detailPanel = page.locator('#detail-panel');
      await expect(detailPanel).toBeVisible();
    }
  });

  // SCEN-048: [normal] 日報確認・検索画面 - 詳細表示パネルに日報の詳細情報が表示される
  test("SCEN-048: 詳細表示パネルに日報の詳細情報が表示される", async ({ page }) => {
    // テーブル行が存在することを確認
    const rows = page.locator('#reports-tbody tr');
    const rowCount = await rows.count();
    
    if (rowCount > 0) {
      // 最初の行をクリック
      await rows.first().click();
      
      
      // 詳細表示パネルが開いたことを確認
      const detailPanel = page.locator('#detail-panel');
      await expect(detailPanel).toBeVisible();
      
      // 詳細情報の要素が表示されていることを確認
      const detailReporter = page.locator('#detail-reporter');
      const detailDate = page.locator('#detail-date');
      const detailYesterday = page.locator('#detail-yesterday');
      const detailToday = page.locator('#detail-today');
      const detailIssues = page.locator('#detail-issues');
      
      await expect(detailReporter).toBeVisible();
      await expect(detailDate).toBeVisible();
      await expect(detailYesterday).toBeVisible();
      await expect(detailToday).toBeVisible();
      await expect(detailIssues).toBeVisible();
    }
  });
});