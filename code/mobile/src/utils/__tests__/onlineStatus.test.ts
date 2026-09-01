import { getOnlineStatus, ONLINE_THRESHOLD_MINUTES } from "../onlineStatus";

describe("getOnlineStatus", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  it("is offline with no label when there is no last-active timestamp", () => {
    expect(getOnlineStatus(null, now)).toEqual({ isOnline: false, lastSeenLabel: null });
    expect(getOnlineStatus(undefined, now)).toEqual({ isOnline: false, lastSeenLabel: null });
  });

  it("is online right at the moment of activity", () => {
    expect(getOnlineStatus(now.toISOString(), now)).toEqual({ isOnline: true, lastSeenLabel: null });
  });

  it(`is online up to and including the ${ONLINE_THRESHOLD_MINUTES}-minute threshold`, () => {
    const lastActive = new Date(now.getTime() - ONLINE_THRESHOLD_MINUTES * 60000);
    expect(getOnlineStatus(lastActive, now)).toEqual({ isOnline: true, lastSeenLabel: null });
  });

  it("flips to offline the minute after the threshold, with a minutes-ago label", () => {
    const lastActive = new Date(now.getTime() - (ONLINE_THRESHOLD_MINUTES + 1) * 60000);
    expect(getOnlineStatus(lastActive, now)).toEqual({ isOnline: false, lastSeenLabel: "Active 11m ago" });
  });

  it("formats an hours-ago label for offline users under a day", () => {
    const lastActive = new Date(now.getTime() - 3 * 3600000);
    expect(getOnlineStatus(lastActive, now)).toEqual({ isOnline: false, lastSeenLabel: "Active 3h ago" });
  });

  it("formats a days-ago label for offline users a day or more inactive", () => {
    const lastActive = new Date(now.getTime() - 2 * 86400000);
    expect(getOnlineStatus(lastActive, now)).toEqual({ isOnline: false, lastSeenLabel: "Active 2d ago" });
  });

  it("treats a malformed timestamp as offline rather than throwing", () => {
    expect(getOnlineStatus("not-a-date", now)).toEqual({ isOnline: false, lastSeenLabel: null });
  });

  it("treats a future timestamp (clock skew) as online", () => {
    const future = new Date(now.getTime() + 60000);
    expect(getOnlineStatus(future, now)).toEqual({ isOnline: true, lastSeenLabel: null });
  });
});
