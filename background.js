// Runs when the Pomodoro alarm fires, even if the popup is closed.
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== 'pomodoro') return;
  const s = await chrome.storage.local.get(null);
  const focusMin = s.focusMin || 25, breakMin = s.breakMin || 5;
  const day = new Date().toDateString();
  let sessions = s.day === day ? (s.sessions || 0) : 0;
  let mode = s.mode || 'focus';
  let message;

  if (mode === 'focus') {
    sessions += 1; mode = 'break';
    message = 'Focus session complete! Time for a break.';
  } else {
    mode = 'focus';
    message = 'Break over. Ready for another focus session?';
  }

  await chrome.storage.local.set({
    mode, sessions, day, running: false, endTime: null,
    remaining: (mode === 'focus' ? focusMin : breakMin) * 60000
  });
  chrome.action.setBadgeText({ text: '' });
  chrome.notifications.create({
    type: 'basic', iconUrl: 'icons/icon128.png', title: 'FocusFlow', message
  });
});
