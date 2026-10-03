/**
 * 一鍵初始化試算表與設定分頁
 * 包含：Questions, Players, Attempts, Mastery, Config
 */

function setup() {
  var spread = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Config
  var configSheet = getOrCreateSheet(spread, 'Config');
  configSheet.clear();
  configSheet.appendRow(['key', 'value']);
  var randomToken = Utilities.getUuid().substring(0, 16);
  configSheet.appendRow(['api_token', randomToken]);
  configSheet.appendRow(['questions_version', String(Date.now())]);

  // 2. Questions
  var qSheet = getOrCreateSheet(spread, 'Questions');
  if (qSheet.getLastRow() === 0) {
    qSheet.appendRow(['id', 'type', 'year', 'level', 'no', 'context', 'target', 'char', 'zhuyin', 'alt_answers', 'tags', 'enabled', 'note']);
  }

  // 3. Players
  var pSheet = getOrCreateSheet(spread, 'Players');
  if (pSheet.getLastRow() === 0) {
    pSheet.appendRow(['player_id', 'nickname', 'avatar', 'pin_hash', 'salt', 'created_at']);
  }

  // 4. Attempts
  var aSheet = getOrCreateSheet(spread, 'Attempts');
  if (aSheet.getLastRow() === 0) {
    aSheet.appendRow(['attempt_id', 'player_id', 'mode', 'year', 'started_at', 'duration_s', 'sound_correct', 'sound_total', 'form_correct', 'form_total', 'score', 'results_json']);
  }

  // 5. Mastery
  var mSheet = getOrCreateSheet(spread, 'Mastery');
  if (mSheet.getLastRow() === 0) {
    mSheet.appendRow(['player_id', 'question_id', 'correct_streak', 'wrong_count', 'last_seen']);
  }

  Logger.log('=============================================');
  Logger.log('初始化成功！');
  Logger.log('你的 API Token 為: ' + randomToken);
  Logger.log('請記得前往「部署」->「新增部署作業」->「網頁應用程式」進行發布！');
  Logger.log('=============================================');
}

function getOrCreateSheet(spread, name) {
  var sheet = spread.getSheetByName(name);
  if (!sheet) {
    sheet = spread.insertSheet(name);
  }
  return sheet;
}
