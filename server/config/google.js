const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes needed for Calendar (events + free/busy) + Meet link generation +
// identity (email/profile). Requested in ONE consent screen — vendors never
// see a separate "connect calendar" step.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
  'profile',
];

const buildOAuthClient = (accessToken, refreshToken) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return auth;
};

// state: opaque string (signed JWT) carried through the OAuth round-trip so the
// callback can tell vendor-auth flows apart from legacy calendar-connect flows
// and reject forged callbacks (CSRF).
const getAuthUrl = (state) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    ...(state ? { state } : {}),
  });
};

const getTokensFromCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

const createCalendarEvent = async (accessToken, refreshToken, eventDetails) => {
  const auth = buildOAuthClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: eventDetails.title,
    description: eventDetails.description || '',
    start: {
      dateTime: eventDetails.startTime,
      timeZone: eventDetails.timezone || 'Asia/Kolkata',
    },
    end: {
      dateTime: eventDetails.endTime,
      timeZone: eventDetails.timezone || 'Asia/Kolkata',
    },
    attendees: eventDetails.attendees || [],
    conferenceData: {
      createRequest: {
        requestId: `bas-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  });

  return {
    eventId: response.data.id,
    meetLink: response.data.hangoutLink,
    htmlLink: response.data.htmlLink,
  };
};

// Free/Busy on the vendor's primary calendar between two instants.
// Returns [{ start: ISO, end: ISO }] busy intervals. Throws on API failure —
// callers decide whether a Google outage blocks bookings (it must not).
const getFreeBusy = async (accessToken, refreshToken, timeMinISO, timeMaxISO) => {
  const auth = buildOAuthClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });
  const { data } = await calendar.freebusy.query({
    resource: {
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      items: [{ id: 'primary' }],
    },
  });
  return (data.calendars?.primary?.busy || []).map((b) => ({ start: b.start, end: b.end }));
};

// Vendor's Google Calendar timezone (used to seed availability.timezone at signup).
const getCalendarTimezone = async (accessToken, refreshToken) => {
  const auth = buildOAuthClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });
  const { data } = await calendar.settings.get({ setting: 'timezone' });
  return data?.value || null;
};

module.exports = {
  oauth2Client,
  getAuthUrl,
  getTokensFromCode,
  createCalendarEvent,
  getFreeBusy,
  getCalendarTimezone,
};
