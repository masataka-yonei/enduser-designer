var CPLReport = {
    Name: "Report",
    Body: {
      Width: "8.5in", // レポートの幅を指定
      Height: "11in", // レポートの高さを指定
    },
};

// 現在のレポートとその名前を保持する変数
var currentReport = undefined;
var currentReportName = undefined;
var resolveFunc = null; // 非同期処理の解決関数
var viewer = null; // レポートビューアのインスタンス
var designer = null; // レポートデザイナのインスタンス
var counter = 0; // 新規レポート作成時のカウンタ

// DOM要素の取得
var viewerHost = document.getElementById("viewer-host");
var designerHost = document.getElementById("designer-host");


// レポートビューアとデザイナのインスタンスを作成
viewer = new MESCIUS.ActiveReportsJS.ReportViewer.Viewer("#viewer-host", {language: "ja"});
designer = new MESCIUS.ActiveReportsJS.ReportDesigner.Designer("#designer-host", { language: "ja" });

// デザイナのアクションハンドラを設定
designer.setActionHandlers({
    // レポートをレンダリングする際の処理
    onRender(report) {
      currentReport = report.definition; // レポートの定義を保持
      currentReportName = report.displayName; // レポート名を保持
      viewer.open(currentReport); // ビューアでレポートを開く
      viewerHost.style.display = "block"; // ビューアを表示
      designerHost.style.display = "none"; // デザイナを非表示
      // return Promise.resolve();
    },
    // 新規レポートを作成する際の処理
    onCreate: function () {
      const reportId = `NewReport${++this.counter}`; // 新規レポートIDを生成
      return Promise.resolve({
        definition: CPLReport, // デフォルトのレポート定義を使用
        id: reportId,
        displayName: reportId,
      });
    },
    // レポートを開く際の処理
    onOpen: function () {
      return DesignerHandlers.openReportDialog(); // レポートダイアログを開く
    },
    // レポートを保存する際の処理
    onSave: function (info) {
      const reportId = info.id || `NewReport${++this.counter}`; // レポートIDを生成
      //reportStorage.set(reportId, info.definition);
      return fetch('/reports', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({
               fileName: reportId.endsWith('.rdlx-json') ? reportId : reportId + '.rdlx-json', // ファイル名を設定
               content: JSON.stringify(info.definition) // レポート内容をJSON形式で送信
           })
       })
       .then(response => response.json())
       .then(data => {
           console.log('Report saved response:', data); // 保存成功時のログ
           return { displayName: reportId };
       })
       .catch(error => {
           console.error('Error saving report:', error); // 保存失敗時のログ
           return { displayName: reportId };
       });
    },
    // レポートを別名で保存する際の処理
    onSaveAs: function (info) {
      // SaveDialog モジュールを使用してダイアログを表示
      return SaveDialog.showSaveAsDialog(info);
    },
});

// デザイナを開くボタンの設定
var designButton = {
  key: "$openDesigner",
  text: "デザイナで編集", // ボタンのツールチップ
  iconCssClass: "mdi mdi-pencil", // ボタンのアイコン
  enabled: true, // ボタンの有効化
  action: function (item) {
    designer.setReport({
      definition: currentReport, // 現在のレポートをデザイナに設定
      displayName: currentReportName,      
    });
    viewerHost.style.display = "none"; // ビューアを非表示
    designerHost.style.display = "block"; // デザイナを表示
  },
};
// ビューアのツールバーにボタンを追加
viewer.toolbar.addItem(designButton);
viewer.toolbar.updateLayout({
  default: [
    "$openDesigner",
    "$split",
    "$navigation",
    "$split",
    "$refresh",
    "$split",
    "$history",
    "$split",
    "$zoom",
    "$fullscreen",
    "$split",
    "$print",
    "$split",
    "$singlepagemode",
    "$continuousmode",
    "$galleymode",
  ],
});

// レポートを選択した際の処理
function onSelectReport(fileName) {
  if (resolveFunc) {
    fetch('/reports/' + fileName) // レポートを取得
      .then(response => response.text())
      .then(text => {
         const definition = JSON.parse(text); // レポート内容を解析
         resolveFunc({
           definition: definition,
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