// src/utils/logger.js
export function logEvent(eventName, data) {
  const log = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  // Save logs in localStorage (or send to a server if needed)
  const logs = JSON.parse(localStorage.getItem('logs')) || [];
  logs.push(log);
  localStorage.setItem('logs', JSON.stringify(logs));

  // Console log (you can replace this with any logging service)
  console.debug("CustomLogger:", JSON.stringify(log));
}
