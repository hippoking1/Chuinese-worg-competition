/**
 * 字音字型小達人 - Google Apps Script Backend Web App
 */

function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function cfg(key) {
  var sheet = ss().getSheetByName('Config');
  if (!sheet) return '';
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == key) return String(data[i][1]);
  }
  return '';
}

function setCfg(key, val) {
  var sheet = ss().getSheetByName('Config');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == key) {
      sheet.getRange(i + 1, 2).setValue(val);
      return;
    }
  }
  sheet.appendRow([key, val]);
}

function readSheet(sheetName) {
  var sheet = ss().getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function doGet(e) {
  var p = e.parameter || {};
  var token = p.token || '';
  var serverToken = cfg('api_token');
  
  if (serverToken && token !== serverToken) {
    return jsonResponse({ ok: false, error: 'Unauthorized token' });
  }

  var action = p.action;

  if (action === 'ping') {
    return jsonResponse({
      ok: true,
      message: 'pong',
      questionsCount: readSheet('Questions').length,
      attemptsCount: readSheet('Attempts').length,
      version: cfg('questions_version')
    });
  }

  if (action === 'questions') {
    var currentVer = cfg('questions_version');
    if (p.v && p.v === currentVer) {
      return jsonResponse({ ok: true, notModified: true, version: currentVer });
    }
    var questions = readSheet('Questions');
    var enabledOnly = questions.filter(function(q) {
      return q.enabled === true || q.enabled === 'TRUE' || q.enabled === 'true';
    });
    return jsonResponse({ ok: true, version: currentVer, questions: enabledOnly });
  }

  if (action === 'players') {
    var players = readSheet('Players');
    return jsonResponse({ ok: true, players: players, parentPinHash: cfg('parent_pin_hash') });
  }

  if (action === 'mastery') {
    var allMastery = readSheet('Mastery');
    var filtered = allMastery.filter(function(r) { return r.player_id == p.pid; });
    return jsonResponse({ ok: true, rows: filtered });
  }

  if (action === 'attempts') {
    var allAttempts = readSheet('Attempts');
    var filteredAtt = allAttempts.filter(function(r) { return r.player_id == p.pid; });
    return jsonResponse({ ok: true, rows: filteredAtt });
  }

  return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
}

function doPost(e) {
  var body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid JSON payload' });
  }

  var serverToken = cfg('api_token');
  if (serverToken && body.token !== serverToken) {
    return jsonResponse({ ok: false, error: 'Unauthorized token' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var action = body.action;

    if (action === 'submitAttempt') {
      var a = body.attempt;
      var sheet = ss().getSheetByName('Attempts');
      if (!sheet) {
        sheet = ss().insertSheet('Attempts');
        sheet.appendRow(['attempt_id', 'player_id', 'mode', 'year', 'started_at', 'duration_s', 'sound_correct', 'sound_total', 'form_correct', 'form_total', 'score', 'results_json']);
      }
      // Duplicate prevention check
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] == a.id) {
          return jsonResponse({ ok: true, message: 'Already recorded' });
        }
      }

      sheet.appendRow([
        a.id,
        a.playerId,
        a.mode,
        a.year || '',
        a.startedAt,
        a.durationSec,
        a.soundCorrect,
        a.soundTotal,
        a.formCorrect,
        a.formTotal,
        a.score,
        a.resultsJson
      ]);

      return jsonResponse({ ok: true });
    }

    if (action === 'importQuestions') {
      var rows = body.rows || [];
      var qSheet = ss().getSheetByName('Questions');
      for (var k = 0; k < rows.length; k++) {
        var r = rows[k];
        qSheet.appendRow([
          r.id, r.type, r.year, r.level || '國小', r.no, r.context, r.target, r.char, r.zhuyin, r.alt_answers || '', r.tags || '', true, r.note || ''
        ]);
      }
      setCfg('questions_version', String(Date.now()));
      return jsonResponse({ ok: true, count: rows.length });
    }

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Automatically bumps question version whenever parent/teacher edits Questions sheet
 */
function onEdit(e) {
  if (e && e.range && e.range.getSheet().getName() === 'Questions') {
    setCfg('questions_version', String(Date.now()));
  }
}
