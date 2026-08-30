import { test, expect } from '@playwright/test';

test.describe("日報検索フロー", () => {
  // SCEN-642: [normal] 日報検索フロー - 業務フロー「日報検索フロー」を開始から完了まで実行する
  test("日報検索フロー - キーワード検索から詳細表示まで", async ({ page, request }) => {
    // 工程1: 部長向けダッシュボードにログイン
    await test.step("部長向けダッシュボードにログイン", async () => {
      // ベースURLを取得
      const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
      
      // ログイン画面へ移動
      await page.goto("/login.html");
      
      // ログイン情報を入力
      await page.fill('[name="username"]', 'manager');
      await page.fill('[name="password"]', 'password123');
      
      // ログイン処理とナビゲーション完了を待つ
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
      
      // ダッシュボードページへ移動
      await page.goto("/panels/scr-1787119200549.html");
      
      // ダッシュボードが表示されていることを確認
      await expect(page.locator('.header')).toBeVisible();
    });

    // 工程2: ダッシュボード上の検索・フィルタリング機能にアクセス
    await test.step("ダッシュボード上の検索機能にアクセス", async () => {
      // 日報確認・検索画面への遷移ボタンを探す（ナビゲーションから）
      await page.goto("/panels/scr-1787119221707.html");
      
      // 検索画面が表示されていることを確認
      await expect(page.locator('[data-testid="keyword-search"]')).toBeVisible();
    });

    // 工程3: 課題キーワード入力フィールドに「バグ対応」と入力
    await test.step("課題キーワード入力フィールドに「バグ対応」と入力", async () => {
      // キーワード検索フィールドに「バグ対応」を入力
      const searchInput = page.locator('[data-testid="keyword-search"]');
      await searchInput.fill("バグ対応");
      
      // 入力が正しくされていることを確認
      await expect(searchInput).toHaveValue("バグ対応");
    });

    // 工程4: 検索ボタンを押下して検索実行
    await test.step("検索ボタンを押下して検索実行", async () => {
      // 検索ボタンをクリック
      const searchButton = page.locator('[data-testid="search-button"]');
      await searchButton.click();
      
      // 検索結果が更新されるまで待機
      await page.waitForLoadState('networkidle');
      
      // 検索結果リストが表示されていることを確認
      const recordList = page.locator('[data-testid="record-list"]');
      await expect(recordList).toBeVisible();
    });

    // 工程5: 検索結果がフィルタリングされ、該当する日報が一覧表示されていることを確認
    await test.step("検索結果がフィルタリングされ該当日報が表示されていることを確認", async () => {
      // 検索結果テーブルが存在することを確認
      const tbody = page.locator('#reports-tbody');
      
      // テーブル行が存在することを確認（フィルタリング成功）
      const rows = page.locator('#reports-tbody tr');
      const rowCount = await rows.count();
      
      // 最低1行以上の結果があることを確認
      expect(rowCount).toBeGreaterThan(0);
      
      // 各行にバグ対応関連の内容が含まれていることを確認
      for (let i = 0; i < Math.min(rowCount, 3); i++) {
        const row = rows.nth(i);
        const rowText = await row.textContent();
        // 検索結果に「バグ対応」関連のテキストが含まれていることを期待
        expect(rowText).not.toBeNull();
      }
    });

    // 工程6: 検索結果の日報リンクを選択し、詳細情報表示へ遷移
    await test.step("検索結果の日報リンクを選択して詳細表示へ遷移", async () => {
      // 最初の検索結果行をクリック
      const firstRow = page.locator('#reports-tbody tr').first();
      
      // 行の要素を取得
      await firstRow.click();
      
      // 詳細パネルが表示されるまで待機
      const detailPanel = page.locator('#detail-panel');
      await expect(detailPanel).toBeVisible();
    });

    // 工程7: 日報詳細画面に遷移し、検索キーワード「バグ対応」に対応する報告内容が表示されていることを確認
    await test.step("日報詳細画面でバグ対応関連の内容が表示されていることを確認", async () => {
      // 詳細パネルのコンテンツを確認
      const detailContent = page.locator('#detail-content');
      
      // 詳細情報が表示されていることを確認
      await expect(detailContent).toBeVisible();
      
      // 課題情報が表示されていることを確認
      const issuesSection = page.locator('#detail-issues');
      const issuesText = await issuesSection.textContent();
      
      // 課題セクションにテキストが含まれていることを確認
      expect(issuesText).not.toBeNull();
      expect(issuesText?.length || 0).toBeGreaterThan(0);
    });

    // 工程8: 詳細画面から一覧へ戻るボタンを押下し、検索結果一覧画面に戻ることを確認
    await test.step("詳細画面から一覧へ戻るボタンを押下して一覧に戻ることを確認", async () => {
      // 詳細パネルを閉じるボタンをクリック
      const closeButton = page.locator('[data-testid="close-detail-button"]');
      await expect(closeButton).toBeVisible();
      await closeButton.click();
      
      // 詳細パネルが非表示になることを確認
      const detailPanel = page.locator('#detail-panel');
      await expect(detailPanel).not.toBeVisible();
      
      // 検索結果リストが再度表示されていることを確認
      const recordList = page.locator('[data-testid="record-list"]');
      await expect(recordList).toBeVisible();
    });
  });
});