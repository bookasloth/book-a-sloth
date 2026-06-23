import { useState, useEffect } from "react";
import {
  setAvailability as saveAvailability,
  getAvailability,
} from "../services/api";
import BackButton from "../components/common/BackButton";
import toast from "react-hot-toast";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DEFAULT_SCHEDULE = DAYS.reduce((acc, day) => {
  acc[day] = [];
  return acc;
}, {});

const Availability = () => {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [bufferMinutes, setBufferMinutes] = useState(0); // Task 13
  const [blockedDates, setBlockedDates] = useState([]); // "YYYY-MM-DD" strings
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const fetchAvailability = async () => {
    try {
      const { data } = await getAvailability();
      if (data) {
        setSchedule(data.weekly_schedule || DEFAULT_SCHEDULE);
        setTimezone(data.timezone || "Asia/Kolkata");
        setBufferMinutes(data.buffer_minutes || 0);
        setBlockedDates(Array.isArray(data.blocked_dates) ? data.blocked_dates : []);
        // Any configured day means availability was set before → open in view mode.
        const configured = Object.values(data.weekly_schedule || {}).some(
          (slots) => Array.isArray(slots) && slots.length > 0
        );
        setHasSaved(configured);
        setIsEditing(!configured);
      } else {
        setIsEditing(true);
      }
    } catch {
      setIsEditing(true); /* no record yet — let them set it up */
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const addSlot = (day) => {
    setSchedule({
      ...schedule,
      [day]: [...schedule[day], { start: "09:00", end: "17:00" }],
    });
    setDirty(true);
  };
  const removeSlot = (day, idx) => {
    setSchedule({
      ...schedule,
      [day]: schedule[day].filter((_, i) => i !== idx),
    });
    setDirty(true);
  };
  const updateSlot = (day, idx, field, val) => {
    const updated = [...schedule[day]];
    updated[idx] = { ...updated[idx], [field]: val };
    setSchedule({ ...schedule, [day]: updated });
    setDirty(true);
  };
  const copyToAll = (sourceDay) => {
    const src = schedule[sourceDay];
    const newSch = {};
    DAYS.forEach((d) => {
      newSch[d] = src.map((s) => ({ ...s }));
    });
    setSchedule(newSch);
    toast.success("Copied to all days");
    setDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveAvailability({
        weekly_schedule: schedule,
        timezone,
        buffer_minutes: bufferMinutes,
        blocked_dates: blockedDates,
      });
      toast.success("Availability saved!");
      setDirty(false);
      setHasSaved(true);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <BackButton hasUnsavedChanges={dirty} />
      <h1 className="text-2xl font-bold mb-2">Set Your Availability</h1>
      <p className="text-gray-500 text-sm mb-6">
        Define when guests can book time with you.
      </p>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="fb-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Your weekly hours</h2>
              <span className="text-xs text-gray-400">
                {timezone}
                {bufferMinutes ? ` · ${bufferMinutes}m buffer` : ""}
              </span>
            </div>
            <div className="space-y-1.5">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-gray-700">{day}</span>
                  <span className={schedule[day]?.length ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {schedule[day]?.length
                      ? schedule[day].map((s) => `${s.start}–${s.end}`).join(", ")
                      : "Unavailable"}
                  </span>
                </div>
              ))}
            </div>
            {blockedDates.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                {blockedDates.length} blocked date{blockedDates.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark sm:w-auto sm:px-8"
          >
            Edit Availability
          </button>
        </div>
      ) : (
      <form onSubmit={handleSubmit}>
        {/* Timezone + Buffer settings */}
        <div className="fb-card p-4 mb-5">
          <h2 className="font-semibold text-sm mb-4">Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <select
                className="fb-input"
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  setDirty(true);
                }}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">
                  America/Los_Angeles (PST)
                </option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
            {/* Task 13: buffer time */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Buffer Between Sessions
                <span className="text-xs text-gray-400 font-normal ml-1">
                  (break after each booking)
                </span>
              </label>
              <select
                className="fb-input"
                value={bufferMinutes}
                onChange={(e) => {
                  setBufferMinutes(parseInt(e.target.value));
                  setDirty(true);
                }}
              >
                <option value={0}>No buffer</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
              {bufferMinutes > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Guests will see {bufferMinutes} min gaps between available
                  slots.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Weekly schedule */}
        <div className="space-y-4">
          {DAYS.map((day) => (
            <div key={day} className="fb-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                <h3 className="font-medium capitalize">{day}</h3>
                <div className="flex flex-wrap gap-2">
                  {schedule[day].length > 0 && (
                    <button
                      type="button"
                      onClick={() => copyToAll(day)}
                      className="text-xs text-primary hover:underline"
                    >
                      Copy to all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => addSlot(day)}
                    className="btn text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1"
                  >
                    + Add slot
                  </button>
                </div>
              </div>
              {schedule[day].length === 0 ? (
                <p className="text-sm text-gray-400">Unavailable</p>
              ) : (
                <div className="space-y-2">
                  {schedule[day].map((slot, i) => (
                    <div
                      key={i}
                      className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] items-center"
                    >
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          updateSlot(day, i, "start", e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          updateSlot(day, i, "end", e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(day, i)}
                        className="justify-self-start text-red-500 hover:text-red-600 text-sm sm:ml-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Blocked dates — full days guests can never book */}
        <div className="fb-card p-4 mt-5">
          <h2 className="font-semibold text-sm mb-1">Blocked Dates</h2>
          <p className="text-xs text-gray-400 mb-3">
            Holidays, time off — these dates show no slots regardless of your weekly schedule.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              className="fb-input flex-1"
              min={new Date().toISOString().slice(0, 10)}
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (!newBlockedDate) return;
                if (blockedDates.includes(newBlockedDate)) {
                  toast.error("Date already blocked");
                  return;
                }
                setBlockedDates([...blockedDates, newBlockedDate].sort());
                setNewBlockedDate("");
                setDirty(true);
              }}
              className="btn text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1"
            >
              + Block date
            </button>
          </div>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-gray-400">No blocked dates</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {blockedDates.map((d) => (
                <span key={d} className="inline-flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-lg">
                  {d}
                  <button
                    type="button"
                    onClick={() => {
                      setBlockedDates(blockedDates.filter((x) => x !== d));
                      setDirty(true);
                    }}
                    className="text-red-400 hover:text-red-600 font-bold"
                    aria-label={`Unblock ${d}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          {hasSaved && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                fetchAvailability();
                setIsEditing(false);
                setDirty(false);
              }}
              className="btn w-full bg-gray-100 text-gray-700 py-2.5 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 sm:w-auto sm:px-8"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 sm:flex-1"
          >
            {loading ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default Availability;
