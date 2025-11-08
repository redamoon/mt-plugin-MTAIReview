// AI Review Plugin JavaScript - 読み込み確認
console.log("AI Review: JavaScriptファイルが読み込まれました", new Date().toISOString());

// ステータスウィジェットを検索（記事編集画面とコンテンツデータ編集画面の両方に対応）
function findStatusWidget() {
  // 記事編集画面のウィジェットID
  const entryWidget = document.getElementById('entry-status-widget');
  if (entryWidget) {
    console.log("AI Review: entry-status-widgetを検出しました");
    return entryWidget;
  }
  
  // コンテンツデータ編集画面のウィジェットID
  const cdWidget = document.getElementById('cd-status-widget');
  if (cdWidget) {
    console.log("AI Review: cd-status-widgetを検出しました");
    return cdWidget;
  }
  
  return null;
}

// 公開ウィジェットを検索（コンテンツデータ編集画面用）
function findPublishingWidget() {
  // mt-widget entry-publishing-widgetクラスを持つ要素を検索
  const publishingWidget = document.querySelector('.mt-widget.entry-publishing-widget');
  if (publishingWidget) {
    console.log("AI Review: entry-publishing-widgetを検出しました");
    return publishingWidget;
  }
  
  return null;
}

// DOMContentLoadedとwindow.onloadの両方に対応
function initAIReviewButton() {
  try {
    console.log("AI Review: 初期化を開始します");
    
    // 既存のウィジェットを確認（正しい構造かチェック）
    const existingWidget = document.querySelector('[data-ai-review-widget]');
    if (existingWidget) {
      // 既存のウィジェットが正しい構造を持っているか確認
      const hasTitle = existingWidget.querySelector('.mt-ai-review-widget-title');
      const hasContent = existingWidget.querySelector('.mt-ai-review-widget-content');
      const hasButton = existingWidget.querySelector('button[data-ai-review-button]');
      
      console.log("AI Review: 既存のウィジェットを確認:", {
        hasTitle: !!hasTitle,
        hasContent: !!hasContent,
        hasButton: !!hasButton,
        widget: existingWidget
      });
      
      if (hasTitle && hasContent && hasButton) {
        console.log("AI Review: 既存のウィジェットが正しく存在します。スキップします");
        // 既存のウィジェットが表示されているか確認
        const computedStyle = window.getComputedStyle(existingWidget);
        console.log("AI Review: 既存ウィジェットの表示状態:", {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity
        });
        // 既存のウィジェットが表示されていない場合は削除して再作成
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
          console.log("AI Review: 既存のウィジェットが非表示です。削除して再作成します");
          existingWidget.remove();
        } else {
          return;
        }
      } else {
        // 構造が不完全な場合は削除
        console.log("AI Review: 既存のウィジェットの構造が不完全です。削除します");
        existingWidget.remove();
      }
    }
    
    // 既存のボタン（ウィジェット外のもの）を削除
    const existingButtons = document.querySelectorAll('button[data-ai-review-button]');
    existingButtons.forEach(btn => {
      // ウィジェット内のボタンは既に処理済み
      if (!btn.closest('[data-ai-review-widget]')) {
        btn.remove();
        console.log("AI Review: 既存のボタンを削除しました");
      }
    });

    // 記事編集画面を検出（複数のセレクタを試す）
    const editorArea = document.querySelector("#entry-body, #body, textarea[name='body'], textarea[id*='body'], .mce-content-body, [data-mt-block-editor], .mt-block-editor-container");
    
    // エディタエリアが見つからなくても続行（MTBlockEditorなど新しいエディタの場合）
    if (editorArea) {
      console.log("AI Review: エディタエリアを検出しました", editorArea);
    } else {
      console.log("AI Review: エディタエリアが見つかりません（MTBlockEditorの可能性があります）");
    }

    // ボタンを作成
    const button = document.createElement("button");
    button.textContent = "AIレビュー";
    button.className = "btn btn-primary";
    button.type = "button";
    button.setAttribute("data-ai-review-button", "true");
    button.style.width = "100%";
    button.style.marginBottom = "15px";

    // ウィジェットコンテナを作成（MTの管理画面のシステムから完全に分離）
    const widgetContainer = document.createElement("div");
    // MTの管理画面が解析しないように、独自のクラス名と構造を使用
    widgetContainer.className = "mt-widget status-widget d-none d-md-flex";
    widgetContainer.setAttribute("data-ai-review-widget", "true");
    // MTの管理画面が解析する可能性のある属性は設定しない
    // 常に表示されるようにする
    widgetContainer.style.display = "block";
    widgetContainer.style.marginBottom = "15px";
    
    // タイトルを作成
    const titleElement = document.createElement("h2");
    titleElement.className = "mt-widget__title first-child";
    titleElement.textContent = "レビュー";
    titleElement.style.margin = "0 0 10px 0";
    titleElement.style.fontSize = "14px";
    titleElement.style.fontWeight = "bold";
    
    // コンテンツエリアを作成
    const contentElement = document.createElement("div");
    contentElement.className = "mt-widget__content last-child";
    contentElement.appendChild(button);
    
    // ウィジェットコンテナにタイトルとコンテンツを追加
    widgetContainer.appendChild(titleElement);
    widgetContainer.appendChild(contentElement);

    // data-role="group"要素を探す
    let targetContainer = null;
    
    // 方法1: data-role="group"を持つ要素を検索
    try {
      const elements = document.querySelectorAll('[data-role="group"]');
      if (elements.length > 0) {
        // 複数見つかった場合、ステータスウィジェットを含むものを優先
        const statusWidget = findStatusWidget();
        if (statusWidget && elements.length > 1) {
          for (const elem of elements) {
            if (elem.contains(statusWidget)) {
              targetContainer = elem;
              console.log("AI Review: data-role='group'を検出しました（ステータスウィジェットを含む）:", targetContainer);
              break;
            }
          }
        }
        
        // 見つからない場合、最初の要素を使用
        if (!targetContainer) {
          targetContainer = elements[0];
          console.log("AI Review: data-role='group'を検出しました:", targetContainer);
        }
      }
    } catch (e) {
      console.log("AI Review: data-role='group'検索でエラー:", e);
    }
    
    // 方法2: ステータスウィジェットの親要素からdata-role="group"を探す
    if (!targetContainer) {
      try {
        const statusWidget = findStatusWidget();
        if (statusWidget) {
          console.log("AI Review: ステータスウィジェットを検出しました。親要素からdata-role='group'を探索します");
          
          // 親要素を遡ってdata-role="group"を探す
          let current = statusWidget.parentElement;
          let depth = 0;
          const maxDepth = 5; // 最大5階層まで探索
          
          while (current && depth < maxDepth) {
            console.log(`AI Review: 探索レベル${depth}:`, current.className, current.id, current.getAttribute('data-role'));
            
            // data-role="group"を持つ要素を探す
            if (current.getAttribute && current.getAttribute('data-role') === 'group') {
              targetContainer = current;
              console.log("AI Review: ステータスウィジェットの親要素からdata-role='group'を検出しました:", targetContainer);
              console.log("AI Review: 検出レベル:", depth);
              break;
            }
            
            current = current.parentElement;
            depth++;
          }
        }
      } catch (e) {
        console.log("AI Review: ステータスウィジェットからの検索でエラー:", e);
      }
    }
    
    // 方法3: mt-secondaryPanel要素を探す（フォールバック）
    if (!targetContainer) {
      let secondaryPanel = null;
      
      try {
        const statusWidget = findStatusWidget();
        if (statusWidget) {
          // 親要素を遡ってmt-secondaryPanelを探す
          let current = statusWidget.parentElement;
          let depth = 0;
          const maxDepth = 5;
          
          while (current && depth < maxDepth) {
            if (current.classList && (
                current.classList.contains('mt-secondaryPanel') ||
                current.className.includes('secondaryPanel') ||
                current.className.includes('secondary-panel')
              )) {
              secondaryPanel = current;
              console.log("AI Review: mt-secondaryPanelを検出しました:", secondaryPanel);
              break;
            }
            current = current.parentElement;
            depth++;
          }
        }
      } catch (e) {
        console.log("AI Review: mt-secondaryPanel検索でエラー:", e);
      }
      
      if (secondaryPanel) {
        targetContainer = secondaryPanel;
      }
    }
    
    // ターゲットコンテナが見つかった場合
    if (targetContainer) {
      console.log("AI Review: targetContainerの詳細情報:");
      console.log("  - className:", targetContainer.className);
      console.log("  - id:", targetContainer.id);
      console.log("  - data-role:", targetContainer.getAttribute('data-role'));
      console.log("  - parentElement:", targetContainer.parentElement);
      console.log("  - parentElement.className:", targetContainer.parentElement ? targetContainer.parentElement.className : 'なし');
      
      // MTの管理画面のシステムを避けるため、ステータスウィジェットまたは公開ウィジェットの直後に追加
      try {
        // まずステータスウィジェットを確認（記事編集画面）
        const statusWidget = findStatusWidget();
        if (statusWidget && statusWidget.parentElement) {
          // ステータスウィジェットの次の兄弟要素として追加（MTの管理画面の解析を避ける）
          if (statusWidget.nextSibling) {
            statusWidget.parentElement.insertBefore(widgetContainer, statusWidget.nextSibling);
          } else {
            statusWidget.parentElement.appendChild(widgetContainer);
          }
          console.log("AI Review: ステータスウィジェットの後にAIレビューボタンを追加しました", widgetContainer);
        } else {
          // コンテンツデータ編集画面の場合、公開ウィジェットを確認
          const publishingWidget = findPublishingWidget();
          if (publishingWidget && publishingWidget.parentElement) {
            // 公開ウィジェットの次の兄弟要素として追加
            if (publishingWidget.nextSibling) {
              publishingWidget.parentElement.insertBefore(widgetContainer, publishingWidget.nextSibling);
            } else {
              publishingWidget.parentElement.appendChild(widgetContainer);
            }
            console.log("AI Review: entry-publishing-widgetの後にAIレビューボタンを追加しました", widgetContainer);
          } else {
            // どちらも見つからない場合、targetContainerの最後に追加
            targetContainer.appendChild(widgetContainer);
            console.log("AI Review: data-role='group'の下にAIレビューボタンを追加しました", widgetContainer);
          }
        }
        
        // 追加が成功したことを確認
        const addedWidget = document.querySelector('[data-ai-review-widget]');
        if (addedWidget) {
          console.log("AI Review: ウィジェットの追加を確認しました", addedWidget);
          console.log("AI Review: ウィジェットの親要素:", addedWidget.parentElement);
          console.log("AI Review: ウィジェットの位置:", addedWidget.getBoundingClientRect());
        } else {
          console.error("AI Review: ウィジェットの追加に失敗しました");
        }
      } catch (e) {
        console.error("AI Review: ウィジェット追加でエラー:", e);
        console.error("AI Review: エラー詳細:", e.stack);
        console.error("AI Review: targetContainer:", targetContainer);
        console.error("AI Review: widgetContainer:", widgetContainer);
        
        // エラーが発生した場合、フォールバック処理
        console.log("AI Review: エラーが発生したため、bodyの最後に追加します");
        try {
          document.body.appendChild(widgetContainer);
          console.log("AI Review: bodyの最後に追加しました（エラー時のフォールバック）");
        } catch (e2) {
          console.error("AI Review: bodyへの追加も失敗:", e2);
        }
      }
    } else {
      // mt-secondaryPanelが見つからない場合、フォールバック処理
      console.log("AI Review: mt-secondaryPanelが見つかりません。フォールバック処理を実行します");
      
      // ステータスウィジェットまたは公開ウィジェットを探す
      let statusWidget = null;
      let publishingWidget = null;
      try {
        statusWidget = findStatusWidget();
        if (statusWidget) {
          console.log("AI Review: ステータスウィジェットを検出しました（フォールバック）:", statusWidget);
        } else {
          publishingWidget = findPublishingWidget();
          if (publishingWidget) {
            console.log("AI Review: entry-publishing-widgetを検出しました（フォールバック）:", publishingWidget);
          }
        }
      } catch (e) {
        console.log("AI Review: ウィジェット検索でエラー:", e);
      }
      
      if (statusWidget) {
        // ステータスウィジェットの親要素を取得
        const parentElement = statusWidget.parentElement || statusWidget.parentNode;
        if (parentElement) {
          parentElement.insertBefore(widgetContainer, statusWidget);
          console.log("AI Review: ステータスウィジェットの上にAIレビューボタンを追加しました（フォールバック）");
        } else {
          statusWidget.insertAdjacentElement('beforebegin', widgetContainer);
          console.log("AI Review: ステータスウィジェットの直前にAIレビューボタンを追加しました（フォールバック）");
        }
      } else if (publishingWidget) {
        // 公開ウィジェットの親要素を取得
        const parentElement = publishingWidget.parentElement || publishingWidget.parentNode;
        if (parentElement) {
          parentElement.insertBefore(widgetContainer, publishingWidget);
          console.log("AI Review: entry-publishing-widgetの上にAIレビューボタンを追加しました（フォールバック）");
        } else {
          publishingWidget.insertAdjacentElement('beforebegin', widgetContainer);
          console.log("AI Review: entry-publishing-widgetの直前にAIレビューボタンを追加しました（フォールバック）");
        }
      } else {
        // どちらも見つからない場合は、サイドバーや右カラムを探す
        console.log("AI Review: ステータスウィジェットも公開ウィジェットも見つかりません。サイドバーを検索します");
        
        const sidebarSelectors = [
          '.sidebar',
          '.right-column',
          '.right-sidebar',
          '.col-right',
          '.entry-sidebar',
          '.content-sidebar',
          '[class*="sidebar"]',
          '.panel-sidebar',
          '.aside'
        ];
        
        let sidebar = null;
        for (const selector of sidebarSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              sidebar = elements[0];
              console.log("AI Review: サイドバーを検出しました（フォールバック）:", selector, sidebar);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (sidebar) {
          // サイドバーの最初にウィジェットコンテナを追加
          if (sidebar.firstChild) {
            sidebar.insertBefore(widgetContainer, sidebar.firstChild);
            console.log("AI Review: サイドバーの最初にAIレビューボタンを追加しました（フォールバック）");
          } else {
            sidebar.appendChild(widgetContainer);
            console.log("AI Review: サイドバーにAIレビューボタンを追加しました（フォールバック）");
          }
        } else {
          // サイドバーも見つからない場合、右側のカラムを探す
          const rightColumnSelectors = [
            '.col-md-3',
            '.col-md-4',
            '.col-lg-3',
            '.col-lg-4',
            '.right-col',
            '.right-column'
          ];
          
          let rightColumn = null;
          for (const selector of rightColumnSelectors) {
            try {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                rightColumn = elements[elements.length - 1];
                console.log("AI Review: 右カラムを検出しました（フォールバック）:", selector, rightColumn);
                break;
              }
            } catch (e) {
              continue;
            }
          }
          
          if (rightColumn) {
            // 右カラムの最初にウィジェットコンテナを追加
            if (rightColumn.firstChild) {
              rightColumn.insertBefore(widgetContainer, rightColumn.firstChild);
              console.log("AI Review: 右カラムの最初にAIレビューボタンを追加しました（フォールバック）");
            } else {
              rightColumn.appendChild(widgetContainer);
              console.log("AI Review: 右カラムにAIレビューボタンを追加しました（フォールバック）");
            }
          } else {
            // 最終フォールバック: bodyの最後に追加（フォームの先頭には追加しない）
            console.log("AI Review: 適切な配置場所が見つかりません。bodyの最後に追加します（最終フォールバック）");
            document.body.appendChild(widgetContainer);
            console.log("AI Review: bodyの最後にAIレビューボタンを追加しました（最終フォールバック）");
          }
        }
      }
    }
    
    console.log("AI Review: AIレビューボタンを追加しました", widgetContainer);
    
    // 追加後の確認
    const addedWidget = document.querySelector('[data-ai-review-widget]');
    if (addedWidget) {
      const computedStyle = window.getComputedStyle(addedWidget);
      console.log("AI Review: 追加後のウィジェットの表示状態:", {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        position: addedWidget.getBoundingClientRect()
      });
    } else {
      console.error("AI Review: ウィジェットの追加を確認できませんでした");
    }

    // ボタンクリックイベント
    button.addEventListener("click", async function() {
      try {
        // テキスト選択をチェック
        const selectedText = getSelectedText();
        
        if (selectedText) {
          // テキストが選択されている場合、選択テキストのみをレビュー対象にする
          await reviewSelectedText(selectedText, button);
          return;
        }
        
        // フィールド選択ダイアログを表示
        const fields = detectAvailableFields();
        if (fields.length === 0) {
          alert("レビュー対象のフィールドが見つかりませんでした。");
          return;
        }
        
        const result = await showFieldSelectionDialog(fields);
        if (!result || !result.fields || result.fields.length === 0) {
          return; // キャンセルされた場合
        }
        
        const selectedFields = result.fields;
        const prompt = result.prompt || "この文章を自然で読みやすい形に改善してください。";
        
        // 選択されたフィールドの内容を取得
        const contents = getFieldContents(selectedFields);
        if (contents.length === 0) {
          // 選択されたフィールドの名前を取得してエラーメッセージに含める
          const fieldNames = selectedFields.map(f => f.label || f.name || 'フィールド').join('、');
          alert(`選択されたフィールド（${fieldNames}）にコンテンツがありません。フィールドにテキストを入力してから再度お試しください。`);
          return;
        }

        // レビュー実行
        await executeReview(contents, prompt, button);
        
      } catch (error) {
        console.error("AIレビューエラー:", error);
        button.disabled = false;
        button.textContent = "AIレビュー";
        alert("エラーが発生しました: " + error.message);
      }
    });
  } catch (error) {
    console.error("AI Review: ボタン初期化エラー:", error);
    // エラーが発生してもボタンは表示を試みる（最小限の機能）
    try {
      const button = document.createElement("button");
      button.textContent = "AIレビュー";
      button.className = "btn btn-primary mt-3";
      button.type = "button";
      button.setAttribute("data-ai-review-button", "true");
      button.style.marginTop = "10px";
      button.style.marginBottom = "10px";
      button.onclick = function() {
        alert("AIレビュー機能の初期化でエラーが発生しました。ページを再読み込みしてください。");
      };
      const form = document.querySelector("form");
      if (form) {
        form.insertBefore(button, form.firstChild);
      }
    } catch (e) {
      console.error("AI Review: フォールバックボタン作成も失敗:", e);
    }
  }
}

// 選択されたテキストを取得
function getSelectedText() {
  // TinyMCEエディタの場合
  if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor) {
    const selection = tinyMCE.activeEditor.selection.getContent({ format: 'text' });
    if (selection && selection.trim()) {
      return selection.trim();
    }
  }
  
  // 通常のテキスト選択
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    return selection.toString().trim();
  }
  
  return null;
}

// カスタムプロンプトボタンを生成する関数
function generatePromptButtons(containerId) {
  const customPrompts = window.MTAIReviewPrompts || [];
  if (customPrompts.length === 0) {
    return '';
  }
  
  const buttonsHtml = customPrompts.map((prompt, index) => {
    return `<button type="button" class="prompt-button" data-prompt="${escapeHtml(prompt)}" style="margin: 5px 5px 5px 0; padding: 6px 12px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;" title="${escapeHtml(prompt)}">${escapeHtml(prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt)}</button>`;
  }).join('');
  
  return `
    <div style="margin-bottom: 10px;">
      <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">よく使うプロンプト:</div>
      <div id="${containerId}-prompt-buttons" style="display: flex; flex-wrap: wrap; margin-bottom: 10px;">
        ${buttonsHtml}
      </div>
    </div>
  `;
}

// プロンプト入力ダイアログを表示（選択テキスト用）
function showPromptDialog(selectedText) {
  return new Promise((resolve) => {
    // 既存のダイアログを削除
    const existingDialog = document.getElementById("aiReviewPromptDialog");
    if (existingDialog) {
      existingDialog.remove();
    }
    
    // ダイアログを作成
    const dialog = document.createElement("div");
    dialog.id = "aiReviewPromptDialog";
    dialog.style.position = "fixed";
    dialog.style.top = "20%";
    dialog.style.left = "30%";
    dialog.style.width = "40%";
    dialog.style.minWidth = "400px";
    dialog.style.maxWidth = "600px";
    dialog.style.background = "#fff";
    dialog.style.border = "2px solid #ccc";
    dialog.style.borderRadius = "8px";
    dialog.style.padding = "20px";
    dialog.style.zIndex = "10000";
    dialog.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
    dialog.style.fontFamily = "Arial, sans-serif";
    
    const defaultPrompt = "この文章を自然で読みやすい形に改善してください。";
    const previewText = selectedText.length > 100 ? selectedText.substring(0, 100) + "..." : selectedText;
    
    dialog.innerHTML = `
      <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #333;">選択テキストをレビュー</h3>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9em;">選択されたテキストをレビューします</p>
      </div>
      <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px; max-height: 100px; overflow-y: auto;">
        <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">選択テキスト（プレビュー）:</div>
        <div style="color: #333; white-space: pre-wrap; font-size: 14px;">${escapeHtml(previewText)}</div>
      </div>
      <div style="margin-top: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">AIへの指示（プロンプト）</label>
        ${generatePromptButtons('promptDialog')}
        <textarea id="promptInput" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: Arial, sans-serif; font-size: 14px; resize: vertical; box-sizing: border-box;">${escapeHtml(defaultPrompt)}</textarea>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 0.85em;">AIにどのようなレビューを依頼するか入力してください</p>
      </div>
      <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancelPromptDialog" style="background: #ccc; color: #333; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer;">キャンセル</button>
        <button id="confirmPromptDialog" style="background: #007bff; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer;">レビュー実行</button>
      </div>
    `;
    
    // 背景クリックで閉じる
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.zIndex = "9999";
    
    // イベントハンドラ
    const cancelBtn = dialog.querySelector("#cancelPromptDialog");
    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      dialog.remove();
      resolve(null);
    });
    
    const confirmBtn = dialog.querySelector("#confirmPromptDialog");
    confirmBtn.addEventListener("click", () => {
      const promptInput = dialog.querySelector("#promptInput");
      const prompt = promptInput ? promptInput.value.trim() : defaultPrompt;
      
      if (!prompt) {
        alert("AIへの指示（プロンプト）を入力してください。");
        return;
      }
      
      overlay.remove();
      dialog.remove();
      resolve(prompt);
    });
    
    // ESCキーで閉じる
    const escHandler = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        dialog.remove();
        document.removeEventListener("keydown", escHandler);
        resolve(null);
      }
    };
    document.addEventListener("keydown", escHandler);
    
    overlay.addEventListener("click", () => {
      overlay.remove();
      dialog.remove();
      resolve(null);
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // プロンプトボタンのイベントハンドラ
    const promptButtons = dialog.querySelectorAll('.prompt-button');
    promptButtons.forEach(button => {
      button.addEventListener('click', function() {
        const promptInput = dialog.querySelector("#promptInput");
        if (promptInput) {
          promptInput.value = this.getAttribute('data-prompt');
          promptInput.focus();
        }
      });
      button.addEventListener('mouseenter', function() {
        this.style.background = '#e0e0e0';
      });
      button.addEventListener('mouseleave', function() {
        this.style.background = '#f0f0f0';
      });
    });
    
    // プロンプト入力欄にフォーカスを設定
    setTimeout(() => {
      const promptInput = dialog.querySelector("#promptInput");
      if (promptInput) {
        promptInput.focus();
        promptInput.select();
      }
    }, 100);
  });
}

// 選択されたテキストをレビュー
async function reviewSelectedText(selectedText, button) {
  const prompt = await showPromptDialog(selectedText);

  if (!prompt) return; // キャンセルされた場合

  button.disabled = true;
  button.textContent = "AIレビュー中...";
  
  // ローディングモーダルを表示
  showLoadingModal();

  try {
    const apiUrl = getApiUrl();
    const blogId = getBlogId();
    
    const params = new URLSearchParams({
      selected_text: selectedText,
      prompt: prompt,
      __mode: 'ai_review',
      blog_id: blogId
    });

    const response = await fetch(apiUrl + '?__mode=ai_review', {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => `HTTP ${response.status}: ${response.statusText}`);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // レスポンスをテキストとして取得してからJSONパース（UTF-8エンコーディングを確実に処理）
    const responseText = await response.text();
    
    // HTMLレスポンスの場合（エラーページなど）を検出
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html') || responseText.trim().startsWith('<HTML')) {
      console.error("AI Review: HTMLレスポンスを受信しました（エラーページの可能性）:", responseText.substring(0, 500));
      throw new Error("APIエンドポイントが正しく応答していません。認証エラーまたはプラグインの設定を確認してください。");
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("AI Review: JSONパースエラー:", e);
      console.error("AI Review: レスポンス内容（最初の500文字）:", responseText.substring(0, 500));
      throw new Error("レスポンスの解析に失敗しました: " + e.message + "（APIエンドポイントが正しく設定されているか確認してください）");
    }
    
    // ローディングモーダルを閉じる
    closeLoadingModal();
    
    button.disabled = false;
    button.textContent = "AIレビュー";

    if (data.review) {
      // レビューテキストが文字列の場合、UTF-8として確実に処理
      const reviewText = typeof data.review === 'string' ? data.review : String(data.review);
      showReviewModal(reviewText);
    } else {
      alert("エラー: " + (data.error || "レビューに失敗しました。"));
    }
  } catch (error) {
    // エラー時もローディングモーダルを閉じる
    closeLoadingModal();
    button.disabled = false;
    button.textContent = "AIレビュー";
    throw error;
  }
}

// 利用可能なフィールドを検出
function detectAvailableFields() {
  const fields = [];
  
  // タイトルフィールド（値が空でもフィールドが存在する場合は追加）
  const titleSelectors = [
    { selector: "#title", label: "タイトル" },
    { selector: "input[name='title']", label: "タイトル" },
    { selector: "#entry-title", label: "タイトル" },
    { selector: "input[name='entry_title']", label: "タイトル" }
  ];
  
  for (const { selector, label } of titleSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      fields.push({
        type: 'title',
        label: label,
        element: el,
        name: el.name || el.id || 'title',
        id: el.id || 'title'
      });
      break; // 最初に見つかったものを使う
    }
  }
  
  // 本文フィールド（エントリ本文）
  const bodyFields = detectBodyFields();
  fields.push(...bodyFields);
  
  // カスタムフィールド
  const customFields = detectCustomFields();
  fields.push(...customFields);
  
  // コンテンツタイプのフィールド
  const contentTypeFields = detectContentTypeFields();
  fields.push(...contentTypeFields);
  
  // デバッグ: すべてのinput/textarea要素をログに出力（フィールド検出の参考用）
  const allInputs = Array.from(document.querySelectorAll('input, textarea')).map(el => ({
    name: el.name || '(nameなし)',
    id: el.id || '(idなし)',
    type: el.type || el.tagName.toLowerCase(),
    value: el.value ? el.value.substring(0, 50) + '...' : '(空)',
    className: el.className || '(classなし)',
    parentClass: el.parentElement ? (el.parentElement.className || '(classなし)') : '(親なし)'
  }));
  console.log("AI Review: ページ内のすべてのinput/textarea要素:", allInputs);
  console.log("AI Review: 検出されたフィールド:", fields.map(f => ({ type: f.type, label: f.label, name: f.name, id: f.id })));
  
  return fields;
}

// 本文フィールドを検出
function detectBodyFields() {
  const fields = [];
  
  // TinyMCEエディタ
  if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor) {
    fields.push({
      type: 'body',
      label: '本文（TinyMCE）',
      element: null, // TinyMCEの場合は特別処理
      name: 'body',
      id: 'body-tinymce',
      getValue: () => tinyMCE.activeEditor.getContent({ format: 'text' })
    });
  }
  
  // MTBlockEditor
  if (document.querySelector('[data-mt-block-editor], .mt-block-editor-container')) {
    const blockEditorSelectors = [
      'input[name="body"]',
      'input[name="text"]',
      'textarea[name="body"]',
      'textarea[name="text"]'
    ];
    
    for (const selector of blockEditorSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        fields.push({
          type: 'body',
          label: '本文（MTBlockEditor）',
          element: el,
          name: el.name || 'body',
          id: el.id || 'body-blockeditor'
        });
        break;
      }
    }
  }
  
  // 通常のテキストエリア
  const bodySelectors = [
    { selector: "#body", label: "本文" },
    { selector: "#entry-body", label: "本文" },
    { selector: "textarea[name='body']", label: "本文" },
    { selector: "textarea[name='text']", label: "本文" }
  ];
  
  for (const { selector, label } of bodySelectors) {
    const el = document.querySelector(selector);
    if (el && !fields.find(f => f.element === el)) {
      fields.push({
        type: 'body',
        label: label,
        element: el,
        name: el.name || 'body',
        id: el.id || 'body'
      });
    }
  }
  
  return fields;
}

// フィールドの値を取得（hidden inputやTinyMCEなどに対応）
function getFieldValue(element) {
  try {
    // TinyMCEエディタの場合
    if (element.id && typeof tinyMCE !== 'undefined') {
      const editor = tinyMCE.get(element.id);
      if (editor) {
        const content = editor.getContent({ format: 'text' });
        if (content && content.trim()) {
          return content.trim();
        }
      }
    }
    
    // 通常のinput/textarea
    if (element.value) {
      return element.value.trim();
    }
    
    // textContent（テキストノードの場合）
    if (element.textContent) {
      return element.textContent.trim();
    }
  } catch (e) {
    console.warn("AI Review: getFieldValueエラー:", e);
  }
  
  return '';
}

// カスタムフィールドを検出
function detectCustomFields() {
  const fields = [];
  const foundElements = new Set(); // 重複を防ぐ
  
  try {
    // すべてのinput/textarea要素を取得
    const allInputs = document.querySelectorAll('input[type="text"], input[type="hidden"], textarea');
    
    allInputs.forEach((el) => {
      // 既に処理済みの要素をスキップ
      if (foundElements.has(el)) {
        return;
      }
      
      // タイトルや本文フィールドはスキップ（既に検出済み）
      const name = el.name || '';
      const id = el.id || '';
      
      if (name === 'title' || name === 'body' || name === 'text' || 
          id === 'title' || id === 'body' || id === 'entry-body' ||
          id.includes('title') || id.includes('entry-body')) {
        return;
      }
      
      // カスタムフィールドのパターンをチェック
      const isCustomField = 
        name.startsWith('customfield_') ||
        name.includes('custom-field') ||
        name.match(/^custom_field_\d+/) ||
        id.startsWith('customfield_') ||
        id.includes('custom-field') ||
        el.closest('.custom-field') ||
        el.closest('[data-custom-field]') ||
        el.closest('.cf-') ||
        (name && name.match(/^cf_\d+$/)) ||
        (id && id.match(/^cf_\d+/));
      
      if (isCustomField) {
        const value = getFieldValue(el);
        if (value) {
          const label = getFieldLabel(el) || `カスタムフィールド: ${name || id || '無名'}`;
          fields.push({
            type: 'custom_field',
            label: label,
            element: el,
            name: name || id || `customfield_${fields.length}`,
            id: id || `customfield_${fields.length}`
          });
          foundElements.add(el);
        }
      }
    });
  } catch (e) {
    console.error("AI Review: detectCustomFieldsエラー:", e);
  }
  
  console.log("AI Review: 検出されたカスタムフィールド:", fields.map(f => ({ label: f.label, name: f.name, id: f.id })));
  return fields;
}

// コンテンツタイプのフィールドを検出
function detectContentTypeFields() {
  const fields = [];
  const foundElements = new Set(); // 重複を防ぐ
  
  try {
    // すべてのinput/textarea要素を取得
    const allInputs = document.querySelectorAll('input[type="text"], input[type="hidden"], textarea');
    
    allInputs.forEach((el) => {
      // 既に処理済みの要素をスキップ
      if (foundElements.has(el)) {
        return;
      }
      
      const name = el.name || '';
      const id = el.id || '';
      
      // タイトルや本文フィールドはスキップ
      if (name === 'title' || name === 'body' || name === 'text' || 
          id === 'title' || id === 'body' || id === 'entry-body' ||
          id.includes('title') || id.includes('entry-body')) {
        return;
      }
      
      // コンテンツタイプのフィールドのパターンをチェック
      const isContentTypeField = 
        name.startsWith('content-field-') ||
        name.match(/^content-field-\d+/) ||
        id.startsWith('editor-input-content-field-') ||
        id.match(/^editor-input-content-field-\d+/) ||
        id.includes('content-field-') ||
        name.includes('content_data_') ||
        el.closest('.content-field') ||
        el.closest('[data-content-field]') ||
        el.closest('.cf-field') ||
        (name && name.match(/^cd_\d+_/)) ||
        (id && id.match(/^cd_\d+_/));
      
      if (isContentTypeField) {
        const value = getFieldValue(el);
        if (value) {
          const label = getFieldLabel(el) || `コンテンツフィールド: ${name || id || '無名'}`;
          fields.push({
            type: 'content_type_field',
            label: label,
            element: el,
            name: name || id || `content-field-${fields.length}`,
            id: id || `content-field-${fields.length}`
          });
          foundElements.add(el);
        }
      }
    });
  } catch (e) {
    console.error("AI Review: detectContentTypeFieldsエラー:", e);
  }
  
  console.log("AI Review: 検出されたコンテンツタイプフィールド:", fields.map(f => ({ label: f.label, name: f.name, id: f.id })));
  return fields;
}

// フィールドのラベルを取得
function getFieldLabel(element) {
  // 親要素からラベルを探す
  let parent = element.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    const label = parent.querySelector('label');
    if (label) {
      return label.textContent.trim();
    }
    parent = parent.parentElement;
  }
  
  // aria-labelやtitle属性を確認
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }
  if (element.title) {
    return element.title;
  }
  
  return null;
}

// フィールド選択ダイアログを表示（プロンプト入力欄付き）
function showFieldSelectionDialog(fields) {
  return new Promise((resolve) => {
    // 既存のダイアログを削除
    const existingDialog = document.getElementById("aiReviewFieldDialog");
    if (existingDialog) {
      existingDialog.remove();
    }
    
    // ダイアログを作成
    const dialog = document.createElement("div");
    dialog.id = "aiReviewFieldDialog";
    dialog.style.position = "fixed";
    dialog.style.top = "15%";
    dialog.style.left = "30%";
    dialog.style.width = "40%";
    dialog.style.minWidth = "400px";
    dialog.style.maxWidth = "600px";
    dialog.style.maxHeight = "75%";
    dialog.style.background = "#fff";
    dialog.style.border = "2px solid #ccc";
    dialog.style.borderRadius = "8px";
    dialog.style.padding = "20px";
    dialog.style.overflowY = "auto";
    dialog.style.zIndex = "10000";
    dialog.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
    dialog.style.fontFamily = "Arial, sans-serif";
    
    // チェックボックスリストを作成
    const checkboxesHtml = fields.map((field, index) => {
      const checked = index === 0 ? 'checked' : ''; // 最初のフィールドをデフォルトで選択
      return `
        <div style="margin: 10px 0; padding: 8px; border: 1px solid #eee; border-radius: 4px;">
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" value="${index}" ${checked} style="margin-right: 10px;">
            <div>
              <div style="font-weight: bold;">${escapeHtml(field.label)}</div>
              <div style="font-size: 0.85em; color: #666; margin-top: 4px;">
                ${escapeHtml(field.type)} (${escapeHtml(field.name)})
              </div>
            </div>
          </label>
        </div>
      `;
    }).join('');
    
    const defaultPrompt = "この文章を自然で読みやすい形に改善してください。";
    
    dialog.innerHTML = `
      <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #333;">レビュー対象を選択</h3>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9em;">複数のフィールドを選択できます</p>
      </div>
      <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
        ${checkboxesHtml}
      </div>
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">AIへの指示（プロンプト）</label>
        ${generatePromptButtons('fieldDialog')}
        <textarea id="promptInput" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: Arial, sans-serif; font-size: 14px; resize: vertical; box-sizing: border-box;">${escapeHtml(defaultPrompt)}</textarea>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 0.85em;">AIにどのようなレビューを依頼するか入力してください</p>
      </div>
      <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancelFieldDialog" class="btn btn-default">キャンセル</button>
        <button id="confirmFieldDialog" class="btn btn-primary">レビュー実行</button>
      </div>
    `;
    
    // 背景クリックで閉じる（overlayを先に作成）
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.zIndex = "9999";
    overlay.addEventListener("click", () => {
      overlay.remove();
      dialog.remove();
      resolve(null);
    });
    
    // イベントハンドラ
    const cancelBtn = dialog.querySelector("#cancelFieldDialog");
    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      dialog.remove();
      resolve(null);
    });
    
    const confirmBtn = dialog.querySelector("#confirmFieldDialog");
    confirmBtn.addEventListener("click", () => {
      const checkedBoxes = dialog.querySelectorAll('input[type="checkbox"]:checked');
      const selectedIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
      const selectedFields = selectedIndices.map(idx => fields[idx]);
      const promptInput = dialog.querySelector("#promptInput");
      const prompt = promptInput ? promptInput.value.trim() : defaultPrompt;
      
      if (!prompt) {
        alert("AIへの指示（プロンプト）を入力してください。");
        return;
      }
      
      overlay.remove();
      dialog.remove();
      resolve({ fields: selectedFields, prompt: prompt });
    });
    
    // ESCキーで閉じる
    const escHandler = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        dialog.remove();
        document.removeEventListener("keydown", escHandler);
        resolve(null);
      }
    };
    document.addEventListener("keydown", escHandler);
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // プロンプトボタンのイベントハンドラ
    const promptButtons = dialog.querySelectorAll('.prompt-button');
    promptButtons.forEach(button => {
      button.addEventListener('click', function() {
        const promptInput = dialog.querySelector("#promptInput");
        if (promptInput) {
          promptInput.value = this.getAttribute('data-prompt');
          promptInput.focus();
        }
      });
      button.addEventListener('mouseenter', function() {
        this.style.background = '#e0e0e0';
      });
      button.addEventListener('mouseleave', function() {
        this.style.background = '#f0f0f0';
      });
    });
    
    // プロンプト入力欄にフォーカスを設定
    setTimeout(() => {
      const promptInput = dialog.querySelector("#promptInput");
      if (promptInput) {
        promptInput.focus();
        promptInput.select();
      }
    }, 100);
  });
}

// 選択されたフィールドの内容を取得
function getFieldContents(fields) {
  const contents = [];
  
  for (const field of fields) {
    let value = '';
    
    // 特別なgetValue関数がある場合（TinyMCEなど）
    if (field.getValue) {
      value = field.getValue();
    } else if (field.element) {
      // 通常のinput/textarea
      if (field.element.tagName === 'INPUT' || field.element.tagName === 'TEXTAREA') {
        value = field.element.value || '';
      } else {
        value = field.element.textContent || field.element.innerText || '';
      }
    }
    
    // MTBlockEditorのJSON形式を処理
    if (value && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          value = parsed.map(block => {
            if (block && typeof block === 'object') {
              return block.content || block.text || block.data?.text || block.data?.content || '';
            }
            return typeof block === 'string' ? block : '';
          }).filter(Boolean).join('\n');
        } else if (parsed && parsed.content) {
          value = parsed.content;
        } else if (parsed && parsed.text) {
          value = parsed.text;
        }
      } catch (e) {
        // JSONパース失敗時はそのまま使用
      }
    }
    
    if (value && value.trim()) {
      contents.push({
        label: field.label,
        type: field.type,
        name: field.name,
        value: value.trim()
      });
    }
  }
  
  return contents;
}

// レビューを実行
async function executeReview(contents, prompt, button) {
  button.disabled = true;
  button.textContent = "AIレビュー中...";
  
  // ローディングモーダルを表示
  showLoadingModal();

  try {
    const apiUrl = getApiUrl();
    const blogId = getBlogId();
    
    // 複数のフィールドの内容を結合
    const combinedContent = contents.map(c => `${c.label}:\n${c.value}`).join('\n\n---\n\n');
    
    const params = new URLSearchParams({
      contents: JSON.stringify(contents),
      combined_content: combinedContent,
      prompt: prompt,
      __mode: 'ai_review',
      blog_id: blogId
    });

    const response = await fetch(apiUrl + '?__mode=ai_review', {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => `HTTP ${response.status}: ${response.statusText}`);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // レスポンスをテキストとして取得してからJSONパース（UTF-8エンコーディングを確実に処理）
    const responseText = await response.text();
    
    // HTMLレスポンスの場合（エラーページなど）を検出
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html') || responseText.trim().startsWith('<HTML')) {
      console.error("AI Review: HTMLレスポンスを受信しました（エラーページの可能性）:", responseText.substring(0, 500));
      throw new Error("APIエンドポイントが正しく応答していません。認証エラーまたはプラグインの設定を確認してください。");
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("AI Review: JSONパースエラー:", e);
      console.error("AI Review: レスポンス内容（最初の500文字）:", responseText.substring(0, 500));
      throw new Error("レスポンスの解析に失敗しました: " + e.message + "（APIエンドポイントが正しく設定されているか確認してください）");
    }
    
    // ローディングモーダルを閉じる
    closeLoadingModal();
    
    button.disabled = false;
    button.textContent = "AIレビュー";

    if (data.review) {
      // レビューテキストが文字列の場合、UTF-8として確実に処理
      const reviewText = typeof data.review === 'string' ? data.review : String(data.review);
      showReviewModal(reviewText);
    } else {
      alert("エラー: " + (data.error || "レビューに失敗しました。"));
    }
  } catch (error) {
    // エラー時もローディングモーダルを閉じる
    closeLoadingModal();
    button.disabled = false;
    button.textContent = "AIレビュー";
    throw error;
  }
}

// API URLを取得
function getApiUrl() {
  if (typeof MT !== 'undefined' && MT.ScriptURI) {
    return MT.ScriptURI;
  }
  const currentPath = window.location.pathname;
  if (currentPath.includes('/cgi-bin/mt/')) {
    return currentPath.substring(0, currentPath.lastIndexOf('/')) + '/mt.cgi';
  }
  return '/cgi-bin/mt/mt.cgi';
}

// Blog IDを取得
function getBlogId() {
  return document.querySelector('input[name="blog_id"]')?.value || 
         (typeof MT !== 'undefined' && MT.BlogID ? MT.BlogID : '');
}

// ローディングモーダル用のESCキーハンドラー（グローバルに保持）
let loadingModalEscHandler = null;

// ローディングモーダルを表示する関数（閉じられない）
function showLoadingModal() {
  // 既存のローディングモーダルとオーバーレイを削除
  const existingLoadingModal = document.getElementById("aiReviewLoadingModal");
  const existingLoadingOverlay = document.getElementById("aiReviewLoadingOverlay");
  if (existingLoadingModal) {
    existingLoadingModal.remove();
  }
  if (existingLoadingOverlay) {
    existingLoadingOverlay.remove();
  }
  
  // 既存のESCキーハンドラーを削除
  if (loadingModalEscHandler) {
    document.removeEventListener("keydown", loadingModalEscHandler, true);
    loadingModalEscHandler = null;
  }

  // 背景の黒透過（オーバーレイ）を作成
  const overlay = document.createElement("div");
  overlay.id = "aiReviewLoadingOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "9998";
  // ローディング中はクリックで閉じられないようにする（イベントを無視）
  overlay.addEventListener("click", function(e) {
    e.stopPropagation();
    e.preventDefault();
  });
  // ESCキーでも閉じられないようにする
  loadingModalEscHandler = function(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      e.preventDefault();
    }
  };
  document.addEventListener("keydown", loadingModalEscHandler, true);

  // ローディングモーダルコンテナを作成
  const loadingModal = document.createElement("div");
  loadingModal.id = "aiReviewLoadingModal";
  loadingModal.style.position = "fixed";
  loadingModal.style.top = "50%";
  loadingModal.style.left = "50%";
  loadingModal.style.transform = "translate(-50%, -50%)";
  loadingModal.style.background = "#fff";
  loadingModal.style.border = "2px solid #ccc";
  loadingModal.style.borderRadius = "8px";
  loadingModal.style.padding = "40px";
  loadingModal.style.zIndex = "9999";
  loadingModal.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  loadingModal.style.fontFamily = "Arial, sans-serif";
  loadingModal.style.textAlign = "center";
  loadingModal.style.minWidth = "200px";

  // ローディングスピナーとメッセージ
  loadingModal.innerHTML = `
    <div style="margin-bottom: 20px;">
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
    </div>
    <div style="color: #333; font-size: 16px; font-weight: bold;">AIレビュー中...</div>
    <div style="color: #666; font-size: 14px; margin-top: 10px;">しばらくお待ちください</div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  // オーバーレイとローディングモーダルを表示（オーバーレイを先に追加）
  document.body.appendChild(overlay);
  document.body.appendChild(loadingModal);
}

// ローディングモーダルを閉じる関数
function closeLoadingModal() {
  const loadingModal = document.getElementById("aiReviewLoadingModal");
  const loadingOverlay = document.getElementById("aiReviewLoadingOverlay");
  if (loadingModal) {
    loadingModal.remove();
  }
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
  // ESCキーのイベントリスナーを削除
  if (loadingModalEscHandler) {
    document.removeEventListener("keydown", loadingModalEscHandler, true);
    loadingModalEscHandler = null;
  }
}

// モーダルウィンドウを表示する関数
function showReviewModal(reviewText) {
  // 既存のモーダルとオーバーレイを削除（結果モーダルとローディングモーダルの両方）
  const existingModal = document.getElementById("aiReviewModal");
  const existingOverlay = document.getElementById("aiReviewModalOverlay");
  const existingLoadingModal = document.getElementById("aiReviewLoadingModal");
  const existingLoadingOverlay = document.getElementById("aiReviewLoadingOverlay");
  
  if (existingModal) {
    existingModal.remove();
  }
  if (existingOverlay) {
    existingOverlay.remove();
  }
  if (existingLoadingModal) {
    existingLoadingModal.remove();
  }
  if (existingLoadingOverlay) {
    existingLoadingOverlay.remove();
  }
  
  // ローディングモーダルのESCキーハンドラーも削除
  if (loadingModalEscHandler) {
    document.removeEventListener("keydown", loadingModalEscHandler, true);
    loadingModalEscHandler = null;
  }

  // 背景の黒透過（オーバーレイ）を作成
  const overlay = document.createElement("div");
  overlay.id = "aiReviewModalOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "9998";

  // モーダルコンテナを作成
  const modal = document.createElement("div");
  modal.id = "aiReviewModal";
  modal.style.position = "fixed";
  modal.style.top = "10%";
  modal.style.left = "20%";
  modal.style.width = "60%";
  modal.style.maxWidth = "800px";
  modal.style.height = "70%";
  modal.style.maxHeight = "600px";
  modal.style.background = "#fff";
  modal.style.border = "2px solid #ccc";
  modal.style.borderRadius = "8px";
  modal.style.padding = "20px";
  modal.style.overflowY = "auto";
  modal.style.zIndex = "9999";
  modal.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  modal.style.fontFamily = "Arial, sans-serif";

  // MarkdownをHTMLに変換
  const htmlContent = markdownToHtml(reviewText);
  
  // モーダル内容
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
      <h3 style="margin: 0; color: #333;">AIレビュー結果</h3>
      <button id="closeAiModal" class="btn btn-default">閉じる</button>
    </div>
    <div style="line-height: 1.8; color: #333; padding: 10px 0;" class="ai-review-content">
      ${htmlContent}
      <style>
        .ai-review-content h1 { font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em 0; color: #222; border-bottom: 2px solid #ddd; padding-bottom: 0.3em; }
        .ai-review-content h2 { font-size: 1.3em; font-weight: bold; margin: 1em 0 0.5em 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
        .ai-review-content h3 { font-size: 1.1em; font-weight: bold; margin: 0.8em 0 0.4em 0; color: #444; }
        .ai-review-content h4 { font-size: 1.05em; font-weight: bold; margin: 0.7em 0 0.3em 0; color: #555; }
        .ai-review-content h5 { font-size: 1em; font-weight: bold; margin: 0.6em 0 0.3em 0; color: #666; }
        .ai-review-content h6 { font-size: 0.95em; font-weight: bold; margin: 0.5em 0 0.3em 0; color: #777; }
        .ai-review-content p { margin: 0.8em 0; }
        .ai-review-content strong { font-weight: bold; color: #000; }
        .ai-review-content em { font-style: italic; }
        .ai-review-content code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 0.9em; }
        .ai-review-content pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; margin: 1em 0; }
        .ai-review-content pre code { background: none; padding: 0; }
        .ai-review-content ul, .ai-review-content ol { margin: 0.8em 0; padding-left: 2em; }
        .ai-review-content li { margin: 0.4em 0; }
        .ai-review-content blockquote { border-left: 4px solid #ddd; padding-left: 1em; margin: 1em 0; color: #666; font-style: italic; }
        .ai-review-content hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }
        .ai-review-content a { color: #007bff; text-decoration: underline; }
        .ai-review-content a:hover { color: #0056b3; }
      </style>
    </div>
  `;

  // モーダルとオーバーレイを閉じる関数
  const closeModal = function() {
    modal.remove();
    overlay.remove();
  };

  // 閉じるボタンのイベント
  const closeButton = modal.querySelector("#closeAiModal");
  closeButton.addEventListener("click", closeModal);

  // 背景（オーバーレイ）クリックで閉じないようにする（誤操作防止）
  overlay.addEventListener("click", function(e) {
    e.stopPropagation();
    e.preventDefault();
  });

  // ESCキーでも閉じないようにする（誤操作防止）
  // ESCキーハンドラーは追加しない

  // オーバーレイとモーダルを表示（オーバーレイを先に追加）
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
}

// HTMLエスケープ関数
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// MarkdownをHTMLに変換する関数
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown;
  
  // コードブロック（```で囲まれた部分）を先に処理（プレースホルダーに置換）
  const codeBlocks = [];
  html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(code.trim());
    return placeholder;
  });
  
  // インラインコード（`で囲まれた部分）もプレースホルダーに置換
  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, function(match, code) {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(code);
    return placeholder;
  });
  
  // 行ごとに分割して処理
  const lines = html.split('\n');
  const result = [];
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  let currentListItem = null; // 現在のリスト項目の内容
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // 空行
    if (!trimmed) {
      if (currentListItem !== null) {
        // リスト項目を閉じる
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push('');
      continue;
    }
    
    // 見出し（より多くの#から順にチェック）
    if (trimmed.startsWith('###### ')) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push(`<h6>${trimmed.substring(7)}</h6>`);
      continue;
    }
    if (trimmed.startsWith('##### ')) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push(`<h5>${trimmed.substring(6)}</h5>`);
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push(`<h4>${trimmed.substring(5)}</h4>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push(`<h3>${trimmed.substring(4)}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push(`<h2>${trimmed.substring(3)}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push(`<h1>${trimmed.substring(2)}</h1>`);
      continue;
    }
    
    // 水平線
    if (trimmed === '---' || trimmed === '***') {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push('<hr>');
      continue;
    }
    
    // 引用
    if (trimmed.startsWith('> ')) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push(`<blockquote>${trimmed.substring(2)}</blockquote>`);
      continue;
    }
    
    // 番号付きリスト
    const numberedMatch = trimmed.match(/^(\d+)\. (.+)$/);
    if (numberedMatch) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (!inList || listType !== 'ol') {
        if (inList) {
          result.push(`</${listType}>`);
        }
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      currentListItem = numberedMatch[2];
      continue;
    }
    
    // 箇条書きリスト
    const listMatch = trimmed.match(/^[\*\-] (.+)$/);
    if (listMatch) {
      if (currentListItem !== null) {
        result.push(`<li>${currentListItem}</li>`);
        currentListItem = null;
      }
      if (!inList || listType !== 'ul') {
        if (inList) {
          result.push(`</${listType}>`);
        }
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      currentListItem = listMatch[1];
      continue;
    }
    
    // リスト項目内の継続行（インデントされている、またはリスト項目の続き）
    if (inList && currentListItem !== null) {
      // リスト項目の続きとして追加
      currentListItem += ' ' + trimmed;
      continue;
    }
    
    // 通常のテキスト
    if (currentListItem !== null) {
      result.push(`<li>${currentListItem}</li>`);
      currentListItem = null;
    }
    if (inList) {
      result.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
    result.push(trimmed);
  }
  
  // リスト項目が残っている場合
  if (currentListItem !== null) {
    result.push(`<li>${currentListItem}</li>`);
  }
  // リストが終わっていない場合
  if (inList) {
    result.push(`</${listType}>`);
  }
  
  html = result.join('\n');
  
  // コードブロックを復元
  codeBlocks.forEach((code, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, '<pre><code>' + escapeHtml(code) + '</code></pre>');
  });
  
  // インラインコードを復元
  inlineCodes.forEach((code, index) => {
    html = html.replace(`__INLINE_CODE_${index}__`, '<code>' + escapeHtml(code) + '</code>');
  });
  
  // 太字（**で囲まれた部分）
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // 斜体（*で囲まれた部分、ただし**の後に処理）
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');
  
  // リンク
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // 段落に変換（空行で区切られた部分）
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    // 既にHTMLタグが含まれている場合はそのまま
    if (/^<(h[1-6]|ul|ol|blockquote|pre|hr)/.test(trimmed)) {
      return trimmed;
    }
    return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>';
  }).filter(p => p).join('\n');
  
  return html;
}

// 初期化を実行（エラーハンドリング付き）
function safeInitAIReviewButton() {
  try {
    console.log("AI Review: 初期化を開始します");
    initAIReviewButton();
    console.log("AI Review: 初期化が完了しました");
  } catch (error) {
    console.error("AI Review: 初期化エラー:", error);
    console.error("AI Review: エラー詳細:", error.stack);
  }
}

// MTの管理画面が完全に読み込まれるまで待機
console.log("AI Review: スクリプトが読み込まれました。document.readyState:", document.readyState);

// MTの管理画面の初期化を待つため、より長い遅延を設定
function delayedInit() {
  // より長い待機時間を設定して、MTの管理画面が完全に初期化されるまで待つ
  console.log("AI Review: 初期化を遅延実行します（2秒後）");
  setTimeout(function() {
    console.log("AI Review: 遅延初期化を実行します");
    safeInitAIReviewButton();
  }, 2000); // 2秒待機してから初期化
}

if (document.readyState === 'loading') {
  console.log("AI Review: DOMContentLoadedイベントを待機します");
  document.addEventListener('DOMContentLoaded', function() {
    console.log("AI Review: DOMContentLoadedイベントが発火しました");
    delayedInit();
  });
} else {
  // DOMContentLoadedが既に発火している場合
  console.log("AI Review: DOMContentLoadedは既に発火済みです。遅延初期化を実行します");
  delayedInit();
}

// window.onloadでも実行（念のため、より長い待機時間）
window.addEventListener('load', function() {
  console.log("AI Review: window.onloadイベントが発火しました");
  setTimeout(function() {
    console.log("AI Review: window.onloadから初期化を実行します");
    safeInitAIReviewButton();
  }, 3000); // 3秒待機してから初期化
});

// MutationObserverを使用して、動的に追加される要素を監視（MTの管理画面の初期化後に開始）
setTimeout(function() {
  if (typeof MutationObserver !== 'undefined') {
    console.log("AI Review: MutationObserverを設定します");
    let initTimeout = null;
    
    const observer = new MutationObserver(function(mutations) {
      // 正しいウィジェットが存在しない場合のみ初期化を試みる
      const existingWidget = document.querySelector('[data-ai-review-widget]');
      const hasButton = existingWidget ? existingWidget.querySelector('button[data-ai-review-button]') : null;
      
      if (!existingWidget || !hasButton) {
        // デバウンス処理：連続した変更を防ぐ
        if (initTimeout) {
          clearTimeout(initTimeout);
        }
        initTimeout = setTimeout(function() {
          console.log("AI Review: MutationObserverが変更を検出しました。ウィジェットがないため初期化を試みます");
          safeInitAIReviewButton();
        }, 1000); // 1秒待機してから初期化
      }
    });
    
    // DOMが読み込まれたら監視を開始（MTの管理画面の初期化後）
    if (document.body) {
      setTimeout(function() {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        console.log("AI Review: MutationObserverの監視を開始しました");
      }, 2000); // 2秒待機してから監視開始
    } else {
      // bodyがまだない場合、bodyが追加されるまで待つ
      const bodyObserver = new MutationObserver(function(mutations, obs) {
        if (document.body) {
          setTimeout(function() {
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            console.log("AI Review: bodyが追加されました。MutationObserverの監視を開始しました");
          }, 2000);
          obs.disconnect();
        }
      });
      bodyObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }
}, 2000); // MTの管理画面の初期化を待つ
