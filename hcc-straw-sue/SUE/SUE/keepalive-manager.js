// SUE — Keepalive & Heartbeat Manager
// Prevents service worker termination during critical operations
// Uses chrome.alarms for scheduled tasks
/* eslint-disable no-console */

// Keepalive for Background Service Worker
let keepAliveInterval = null;

// Start keepalive ping to prevent service worker termination
function startKeepalive() {
  if (keepAliveInterval) {
    console.log('[HCC Keepalive] Already active');
    return;
  }

  keepAliveInterval = setInterval(function () {
    // Ping local storage to keep worker alive
    chrome.storage.local.get('__ping__', function (_result) {
      // Minimal work to keep worker active
      const ping = Date.now();
      chrome.storage.local.set({ __ping__: ping });
    });

    console.log('[HCC Keepalive] Worker pinged');
  }, 20000); // Every 20 seconds (before 30s timeout)

  console.log('[HCC Keepalive] Keepalive started');
}

// Stop keepalive ping
function stopKeepalive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[HCC Keepalive] Keepalive stopped');
  }
}

// Schedule a recurring task
function scheduleTask(name, periodMinutes, _task) {
  const alarmName = 'hcc_' + name + '_alarm';

  chrome.alarms.create(alarmName, {
    periodInMinutes: periodMinutes,
  });

  console.log('[HCC Alarms] Scheduled "' + name + '" every ' + periodMinutes + 'm');
}

// Listen for scheduled alarms
function setupAlarmListener() {
  chrome.alarms.onAlarm.addListener(function (alarm) {
    switch (alarm.name) {
      case 'hcc_session_refresh_alarm':
        handleSessionRefresh();
        break;

      case 'hcc_cloud_sync_alarm':
        handleCloudSync();
        break;

      case 'hcc_cleanup_alarm':
        handleCleanup();
        break;

      default:
        console.log('[HCC Alarms] Unknown alarm: ' + alarm.name);
    }
  });
}

// Handle session refresh
// NOTE: Called directly from the alarm listener inside the service worker.
// Do NOT use chrome.runtime.sendMessage here — that would create a loop
// (service worker sending a message to itself). Instead this is a stub
// that background.js overrides via the scheduleTask callback pattern.
function handleSessionRefresh() {
  console.log('[HCC Alarms] Session refresh triggered');
  // Actual refresh is handled by background.js which calls sessionRefresh()
  // directly. This stub is kept so the alarm listener switch-case stays clean.
}

// Handle cloud sync
function handleCloudSync() {
  console.log('[HCC Alarms] Cloud sync triggered');
}

// Handle cleanup
function handleCleanup() {
  console.log('[HCC Alarms] Cleanup triggered');
}

// Schedule a one-time task
function scheduleOnce(name, delaySeconds, task) {
  const delayMs = delaySeconds * 1000;

  setTimeout(function () {
    task()
      .then(function () {
        console.log('[HCC Once] Task "' + name + '" completed');
      })
      .catch(function (err) {
        console.error('[HCC Once] Task "' + name + '" failed:', err);
      });
  }, delayMs);

  console.log('[HCC Once] Scheduled "' + name + '" in ' + delaySeconds + 's');
}

// Export to global scope for importScripts()
globalThis.HCCKeepaliveManager = {
  startKeepalive: startKeepalive,
  stopKeepalive: stopKeepalive,
  scheduleTask: scheduleTask,
  setupAlarmListener: setupAlarmListener,
  scheduleOnce: scheduleOnce,
};
