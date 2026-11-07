/* Private Workspace persistence bridge. Deploy only after reading docs/WORKSPACE.md.
 * Script Properties: WORKSPACE_SECRET (32+ characters), STATE_FILE_ID (private JSON file).
 * No client credentials, member data or file identifiers belong in public source.
 */
var MAX_DOCUMENT_BYTES = 1024 * 1024;

function bridgeJson(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function bridgeHex(bytes) {
  return bytes.map(function (value) { return ('0' + ((value + 256) % 256).toString(16)).slice(-2); }).join('');
}

function bridgeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== 64 || right.length !== 64) return false;
  var difference = 0;
  for (var i = 0; i < 64; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function bridgeValidateState(state) {
  var collections = ['people', 'groups', 'projects', 'memberships', 'contributions', 'decisions', 'activity', 'processed'];
  return state && Number.isSafeInteger(state.revision) && state.revision >= 0 &&
    collections.every(function (key) { return Array.isArray(state[key]); }) &&
    (state.constitutions === undefined || Array.isArray(state.constitutions));
}

function doPost(event) {
  var lock;
  try {
    if (!event || !event.postData || typeof event.postData.contents !== 'string' || event.postData.contents.length > MAX_DOCUMENT_BYTES * 2 + 1024) throw new Error('Invalid request');
    var envelope = JSON.parse(event.postData.contents);
    if (typeof envelope.payload !== 'string' || Utilities.newBlob(envelope.payload).getBytes().length > MAX_DOCUMENT_BYTES) throw new Error('Invalid payload');
    var properties = PropertiesService.getScriptProperties();
    var secret = properties.getProperty('WORKSPACE_SECRET');
    var fileId = properties.getProperty('STATE_FILE_ID');
    if (!secret || secret.length < 32 || !fileId) throw new Error('Not configured');
    var signature = bridgeHex(Utilities.computeHmacSha256Signature(envelope.payload, secret, Utilities.Charset.UTF_8));
    if (!bridgeEqual(signature, envelope.signature)) throw new Error('Invalid signature');
    var message = JSON.parse(envelope.payload);
    if (message.version !== 1 || !Number.isSafeInteger(message.timestamp) || Math.abs(Date.now() - message.timestamp) > 60000 ||
      typeof message.nonce !== 'string' || !/^[a-zA-Z0-9-]{20,80}$/.test(message.nonce) || !['read', 'cas'].includes(message.action)) throw new Error('Invalid message');
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('Busy');
    var cache = CacheService.getScriptCache();
    var nonceKey = 'request:' + message.nonce;
    if (cache.get(nonceKey)) throw new Error('Repeated request');
    cache.put(nonceKey, 'used', 120);
    var file = DriveApp.getFileById(fileId);
    var stored = file.getBlob();
    if (stored.getBytes().length > MAX_DOCUMENT_BYTES) throw new Error('State exceeds limit');
    var current = JSON.parse(stored.getDataAsString('UTF-8'));
    if (!bridgeValidateState(current)) throw new Error('Invalid stored state');
    if (message.action === 'read') return bridgeJson({ ok: true, state: current });
    if (!Number.isSafeInteger(message.expectedRevision) || message.expectedRevision < 0 || !bridgeValidateState(message.state) || message.state.revision !== message.expectedRevision + 1) throw new Error('Invalid next state');
    if (current.revision !== message.expectedRevision) return bridgeJson({ ok: true, swapped: false });
    var next = JSON.stringify(message.state);
    if (Utilities.newBlob(next).getBytes().length > MAX_DOCUMENT_BYTES) throw new Error('State exceeds limit');
    file.setContent(next);
    return bridgeJson({ ok: true, swapped: true });
  } catch (error) {
    // Do not echo file IDs, exception text, secrets or private records.
    return bridgeJson({ ok: false, error: 'Request rejected or storage unavailable.' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
