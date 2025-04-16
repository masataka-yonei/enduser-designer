var DesignerHandlers = (function() {
  var resolveFunc = null; // 非同期処理の解決関数

  // モーダルダイアログを作成する関数
  function createModalDialog() {
    if (document.getElementById('dlgOpen')) return; // 既にダイアログが存在する場合は何もしない

    // モーダルダイアログのHTMLを定義
    var modalHtml = `
      <div class="modal" id="dlgOpen" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">レポートを開く</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <strong>レポートを選択してください:</strong>
              <div class="list-group" id="listReports"></div> <!-- レポートリストを表示する要素 -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">閉じる</button>
            </div>
          </div>
        </div>
      </div>
    `;
    $('body').append(modalHtml); // HTMLをDOMに追加
  }

  // レポートリストを取得して表示する関数
  function fillReportList() {
    fetch('/reports') // サーバーからレポートリストを取得
      .then(response => response.json())
      .then(files => {
        $("#listReports").empty(); // リストをクリア
        files.forEach(file => {
          const openReportBtn = $('<button type="button" class="list-group-item list-group-item-action">' + file + '</button>'); // レポートボタンを作成
          openReportBtn.on("click", function () {
            DesignerHandlers.onSelectReport(file); // ボタンがクリックされた際の処理
          });
          $("#listReports").append(openReportBtn); // ボタンをリストに追加
        });
      })
      .catch(error => {
        console.error('Failed to load reports:', error); // エラー時のログ
      });
  }

  // レポートを開くダイアログを表示する関数
  function openReportDialog() {
    return new Promise((resolve, reject) => {
      resolveFunc = resolve; // 解決関数を設定
      createModalDialog(); // モーダルダイアログを作成
      $("#dlgOpen").modal("show"); // ダイアログを表示
      fillReportList(); // レポートリストを表示
    });
  }

  // レポートを選択した際の処理
  function onSelectReport(fileName) {
    if (resolveFunc) {
      fetch('/reports/' + fileName) // 選択されたレポートを取得
        .then(response => response.text())
        .then(text => {
          const definition = JSON.parse(text); // レポート内容を解析
          resolveFunc({
            definition: definition, // レポート定義を設定
            id: fileName,
            displayName: fileName,
          });
          $("#dlgOpen").modal("hide"); // ダイアログを閉じる
          resolveFunc = null; // 解決関数をリセット
        })
        .catch(error => {
          console.error('Failed to load report:', error); // エラー時のログ
          $("#dlgOpen").modal("hide"); // ダイアログを閉じる
          resolveFunc = null; // 解決関数をリセット
        });
    }
  }

  // DesignerHandlers オブジェクトを返す
  return {
    fillReportList: fillReportList, // レポートリストを表示する関数
    openReportDialog: openReportDialog, // レポートダイアログを開く関数
    onSelectReport: onSelectReport // レポートを選択する関数
  };
})();