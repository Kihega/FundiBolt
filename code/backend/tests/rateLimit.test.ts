import { createRateLimiter } from "../src/middleware/rateLimit";

function mockReq(ip: string, path = "/test") {
  return { ip, baseUrl: "", path } as any;
}

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.headers = {};
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  res.setHeader = jest.fn((key: string, value: string) => {
    res.headers[key] = value;
  });
  return res;
}

describe("createRateLimiter", () => {
  it("allows requests under the limit through", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 3, message: "Too many." });
    const next = jest.fn();

    for (let i = 0; i < 3; i++) {
      limiter(mockReq("1.2.3.4"), mockRes(), next);
    }

    expect(next).toHaveBeenCalledTimes(3);
  });

  it("blocks with 429 once the limit is exceeded", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2, message: "Too many." });
    const next = jest.fn();

    limiter(mockReq("1.2.3.4"), mockRes(), next);
    limiter(mockReq("1.2.3.4"), mockRes(), next);
    const res = mockRes();
    limiter(mockReq("1.2.3.4"), res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ message: "Too many." });
    expect(res.headers["Retry-After"]).toBeDefined();
  });

  it("tracks separate clients (by IP) independently", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1, message: "Too many." });
    const next = jest.fn();

    limiter(mockReq("1.1.1.1"), mockRes(), next);
    limiter(mockReq("2.2.2.2"), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("tracks separate routes independently, even for the same client", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1, message: "Too many." });
    const next = jest.fn();

    limiter(mockReq("1.1.1.1", "/login"), mockRes(), next);
    limiter(mockReq("1.1.1.1", "/signup"), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("resets the count after the window elapses", () => {
    jest.useFakeTimers();
    try {
      const limiter = createRateLimiter({ windowMs: 1000, max: 1, message: "Too many." });
      const next = jest.fn();

      limiter(mockReq("1.1.1.1"), mockRes(), next);
      jest.advanceTimersByTime(1001);
      limiter(mockReq("1.1.1.1"), mockRes(), next);

      expect(next).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
