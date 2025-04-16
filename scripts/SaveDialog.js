/**
 * 「名前を付けて保存」モーダルダイアログを制御するモジュール
 * モーダルダイアログのHTMLも動的に生成します
 */
var SaveDialog = (function() {
  var counter = 0; // 新規レポート作成時のカウンタ
  var currentResolve = null; // 非同期処理の解決関数
  var modalCreated = false; // モーダルが作成済みかどうかを示すフラグ
  
  /**
   * モーダルダイアログのHTML要素を生成
   */
  function createModalDialog() {
    // 既にモーダルが存在する場合は作成しない
    if (document.getElementById('dlgSaveAs')) {
      return;
    }
    
    // モーダルダイアログのHTML
    var modalHtml = `
      <div class="modal" id="dlgSaveAs" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">名前を付けて保存</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <input id="saveAsFileName" type="text" class="form-control" placeholder="ファイル名" /> <!-- ファイル名入力フィールド -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" id="btnSaveAsConfirm">保存</button> <!-- 保存ボタン -->
              <button type="button" class="btn btn-secondary" data-dismiss="modal">キャンセル</button> <!-- キャンセルボタン -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    // bodyの最後にモーダルを追加
    $('body').append(modalHtml);
    modalCreated = true; // モーダル作成済みフラグを更新
  }
  
  /**
   * イベントハンドラーの初期化
   */
  function initEventHandlers() {
    // 確認ボタンのクリックイベント
    $(document).on("click", "#btnSaveAsConfirm", function() {
      handleConfirm(); // 確認処理を実行
    });
    
    // キャンセルボタンのクリックイベント
    $(document).on("click", "#dlgSaveAs .btn-secondary", function() {
      handleCancel(); // キャンセル処理を実行
    });
    
    // クローズボタンのクリックイベント
    $(document).on("click", "#dlgSaveAs .close", function() {
      handleCancel(); // キャンセル処理を実行
    });
    
    // Enterキーのイベント
    $(document).on("keypress", "#saveAsFileName", function(e) {
      if (e.which === 13) {  // Enterキーコード
        handleConfirm(); // 確認処理を実行
      }
    });
  }
  
  /**
   * 確認ボタン処理
   */
  function handleConfirm() {
    var reportId = $("#saveAsFileName").val().trim(); // 入力されたファイル名を取得
    if (!reportId) {
      reportId = "NewReport" + (++counter); // ファイル名が空の場合はデフォルト名を設定
    }
    
    $("#dlgSaveAs").modal("hide"); // モーダルを閉じる
    
    if (currentResolve) {
      currentResolve({ id: reportId, displayName: reportId }); // 解決関数を呼び出し
      currentResolve = null; // 解決関数をリセット
    }
  }
  
  /**
   * キャンセル処理
   */
  function handleCancel() {
    $("#dlgSaveAs").modal("hide"); // モーダルを閉じる
    
    if (currentResolve) {
      currentResolve(null); // 解決関数を呼び出し（キャンセル）
      currentResolve = null; // 解決関数をリセット
    }
  }
  
  /**
   * 報告書の保存処理
   * @param {Object} definition - 保存する報告書の定義
   * @returns {Promise} - 保存結果を含むPromise
   */
  function saveReport(definition, reportId) {
    return fetch('/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: reportId.endsWith('.rdlx-json') ? reportId : reportId + '.rdlx-json', // ファイル名を設定
        content: JSON.stringify(definition) // レポート内容をJSON形式で送信
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Report saved response:', data); // 保存成功時のログ
      return { id: reportId, displayName: reportId }; // 保存結果を返す
    })
    .catch(error => {
      console.error('Error saving report:', error); // 保存失敗時のログ
      return { id: reportId, displayName: reportId }; // エラー時の結果を返す
    });
  }
  
  /**
   * モジュールの初期化
   */
  function init() {
    // モーダルダイアログを生成
    createModalDialog();
    // イベントハンドラーを初期化
    initEventHandlers();
  }
  
  // DOMContentLoadedでモジュールを初期化
  $(function() {
    init();
  });
  
  // 公開API
  return {
    /**
     * 「名前を付けて保存」ダイアログを表示
     * @param {Object} info - 保存する情報
     * @returns {Promise} - ユーザーの選択結果を含むPromise
     */
    showSaveAsDialog: function(info) {
      // モーダルがまだ作成されていない場合は作成
      if (!modalCreated) {
        init();
      }
      
      return new Promise(function(resolve) {
        $("#saveAsFileName").val(""); // ファイル名入力フィールドをクリア
        $("#dlgSaveAs").modal("show"); // モーダルを表示
        currentResolve = resolve; // 解決関数を設定
        
        // Enterキーでの送信やフォーカス設定
        setTimeout(function() {
          $("#saveAsFileName").focus(); // フォーカスを設定
        }, 300);
      }).then(function(result) {
        if (result) {
          return saveReport(info.definition, result.id); // レポートを保存
        }
        return null; // キャンセル時はnullを返す
      });
    },
    
    /**
     * カウンター値の設定（初期値設定用）
     * @param {number} value - カウンター値
     */
    setCounter: function(value) {
      counter = value; // カウンター値を設定
    }
  };
})();