export const handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get('session_id');

  if (sessionId && sessions.has(sessionId)) {
    // Attach session data to the request event
    event.locals.user = sessions.get(sessionId);
  } else {
    event.locals.user = null; // No session or invalid session
  }

  return resolve(event);
};
