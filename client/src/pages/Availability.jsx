import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  setAvailability as saveAvailability,
  getAvailability,
} from "../services/api";
import BackButton from "../components/common/BackButton";
import toast from "react-hot-toast";
import {
  PageHeader, Card, Button, FormField, Select, Input, StickyActionBar, cn,
} from "../components/dashboard/ui";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DEFAULT_SCHEDULE = DAYS.reduce((acc, day) => { acc[day] = []; return acc; }, {});

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

  useEffect(() => { fetchAvailability(); }, []);

  const addSlot = (day) => {
    setSchedule({ ...schedule, [day]: [...schedule[day], { start: "09:00", end: "17:00" }] });
    setDirty(true);
  };
  const removeSlot = (day, idx) => {
    setSchedule({ ...schedule, [day]: schedule[day].filter((_, i) => i !== idx) });
    setDirty(true);
  };
  const updateSlot = (day, idx, field, val) => {
    const updated = [...schedule[day]];
    updated[idx] = { ...updated[idx], [field]: val };
    setSchedule({ ...schedule, [day]: updated });
    setDirty(true);
  };
  // Per-day open/closed. A day is "open" when it has ≥1 slot; toggling on seeds a
  // default 9–5 window, toggling off clears the day (matches the save model where
  // an empty slot array = unavailable). Removing the last slot also closes the day.
  const isDayOpen = (day) => (schedule[day]?.length || 0) > 0;
  const toggleDay = (day) => {
    setSchedule((s) => ({ ...s, [day]: s[day]?.length ? [] : [{ start: "09:00", end: "17:00" }] }));
    setDirty(true);
  };
  const copyToAll = (sourceDay) => {
    const src = schedule[sourceDay];
    const newSch = {};
    DAYS.forEach((d) => { newSch[d] = src.map((s) => ({ ...s })); });
    setSchedule(newSch);
    toast.success("Copied to all days");
    setDirty(true);
  };

  // Mirror the server validation (P1-10) for instant feedback: each window must
  // have end > start and windows on a day must not overlap. HH:MM strings from
  // <input type="time"> compare lexically, so string comparison is correct.
  const validateSchedule = () => {
    for (const day of DAYS) {
      const windows = schedule[day] || [];
      const ranges = [];
      for (const w of windows) {
        if (!w.start || !w.end) return `Fill in both times on ${day}.`;
        if (w.end <= w.start) return `On ${day}, the end time must be after the start time.`;
        ranges.push([w.start, w.end]);
      }
      ranges.sort((a, b) => (a[0] < b[0] ? -1 : 1));
      for (let i = 1; i < ranges.length; i++) {
        if (ranges[i][0] < ranges[i - 1][1]) return `Overlapping time windows on ${day}.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduleErr = validateSchedule();
    if (scheduleErr) { toast.error(scheduleErr); return; }
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
    <div className="mx-auto max-w-3xl">
      <BackButton hasUnsavedChanges={dirty} />
      <PageHeader title="Set Your Availability" subtitle="Define when guests can book time with you." />

      {!isEditing ? (
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Your weekly hours</h2>
              <span className="text-xs text-gray-400">
                {timezone}{bufferMinutes ? ` · ${bufferMinutes}m buffer` : ""}
              </span>
            </div>
            <div className="space-y-1.5">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-gray-700">{day}</span>
                  <span className={schedule[day]?.length ? "font-medium text-gray-900" : "text-gray-400"}>
                    {schedule[day]?.length ? schedule[day].map((s) => `${s.start}–${s.end}`).join(", ") : "Unavailable"}
                  </span>
                </div>
              ))}
            </div>
            {blockedDates.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                {blockedDates.length} blocked date{blockedDates.length > 1 ? "s" : ""}
              </p>
            )}
          </Card>
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto sm:px-8">Edit Availability</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Timezone + Buffer settings */}
          <Card className="mb-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Settings</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Timezone" htmlFor="av-tz" className="mb-0">
                <Select id="av-tz" value={timezone} onChange={(e) => { setTimezone(e.target.value); setDirty(true); }}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </Select>
              </FormField>
              <FormField
                label={<>Buffer Between Sessions <span className="ml-1 font-normal text-gray-400">(break after each booking)</span></>}
                htmlFor="av-buffer"
                className="mb-0"
              >
                <Select id="av-buffer" value={bufferMinutes} onChange={(e) => { setBufferMinutes(parseInt(e.target.value)); setDirty(true); }}>
                  <option value={0}>No buffer</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </Select>
                {bufferMinutes > 0 && (
                  <p className="mt-1 text-xs text-blue-600">Guests will see {bufferMinutes} min gaps between available slots.</p>
                )}
              </FormField>
            </div>
          </Card>

          {/* Weekly schedule */}
          <div className="space-y-4">
            {DAYS.map((day) => {
              const open = isDayOpen(day);
              return (
              <Card key={day}>
                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {/* Per-day on/off switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={open}
                      aria-label={`${open ? "Close" : "Open"} ${day}`}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40",
                        open ? "bg-primary" : "bg-gray-200",
                      )}
                    >
                      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", open ? "translate-x-6" : "translate-x-1")} />
                    </button>
                    <h3 className="font-medium capitalize text-gray-900">{day}</h3>
                    {!open && <span className="text-xs text-gray-400">Closed</span>}
                  </div>
                  {open && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => copyToAll(day)} className="text-xs font-medium text-primary hover:underline">Copy to all</button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => addSlot(day)}>
                        <Plus className="h-3.5 w-3.5" /> Add slot
                      </Button>
                    </div>
                  )}
                </div>
                {open && (
                  <div className="space-y-2">
                    {schedule[day].map((slot, i) => (
                      <div key={i} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
                        <Input type="time" value={slot.start} onChange={(e) => updateSlot(day, i, "start", e.target.value)} />
                        <span className="text-center text-gray-400">to</span>
                        <Input type="time" value={slot.end} onChange={(e) => updateSlot(day, i, "end", e.target.value)} />
                        <button type="button" onClick={() => removeSlot(day, i)} className="justify-self-start text-sm text-red-500 hover:text-red-600 sm:ml-1">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              );
            })}
          </div>

          {/* Blocked dates — full days guests can never book */}
          <Card className="mt-5">
            <h2 className="mb-1 text-base font-semibold text-gray-900">Blocked Dates</h2>
            <p className="mb-3 text-xs text-gray-400">Holidays, time off — these dates show no slots regardless of your weekly schedule.</p>
            <div className="mb-3 flex gap-2">
              <Input
                type="date"
                className="flex-1"
                min={new Date().toISOString().slice(0, 10)}
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!newBlockedDate) return;
                  if (blockedDates.includes(newBlockedDate)) { toast.error("Date already blocked"); return; }
                  setBlockedDates([...blockedDates, newBlockedDate].sort());
                  setNewBlockedDate("");
                  setDirty(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Block date
              </Button>
            </div>
            {blockedDates.length === 0 ? (
              <p className="text-sm text-gray-400">No blocked dates</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blockedDates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700">
                    {d}
                    <button
                      type="button"
                      onClick={() => { setBlockedDates(blockedDates.filter((x) => x !== d)); setDirty(true); }}
                      className="font-bold text-red-400 hover:text-red-600"
                      aria-label={`Unblock ${d}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <StickyActionBar>
            {hasSaved && (
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => { fetchAvailability(); setIsEditing(false); setDirty(false); }}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Availability"}
            </Button>
          </StickyActionBar>
        </form>
      )}
    </div>
  );
};

export default Availability;
