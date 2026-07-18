import cron from "node-cron";
import axios from "axios";
import Api from "../models/Api.js";
import Check from "../models/Check.js";

async function checkOne(api) {
  const start = Date.now();
  try {
    const response = await axios.request({
      url: api.url,
      method: api.method,
      timeout: api.timeoutMs,
      validateStatus: () => true, // we classify the status ourselves
    });
    const responseTime = Date.now() - start;
    const success = response.status === api.expectedStatus;

    await Check.create({
      api: api._id,
      success,
      statusCode: response.status,
      responseTime,
      error: success ? null : `Expected ${api.expectedStatus}, got ${response.status}`,
    });

    const status = success ? (responseTime > 1000 ? "warning" : "healthy") : "down";
    await Api.updateOne(
      { _id: api._id },
      { status, lastResponseTime: responseTime, lastCheckedAt: new Date() }
    );
  } catch (err) {
    const responseTime = Date.now() - start;
    await Check.create({
      api: api._id,
      success: false,
      statusCode: null,
      responseTime,
      error: err.code === "ECONNABORTED" ? "Request timed out" : err.message,
    });
    await Api.updateOne(
      { _id: api._id },
      { status: "down", lastResponseTime: null, lastCheckedAt: new Date() }
    );
  }
}

// Runs on the CHECK_CRON schedule. Each API also has its own checkIntervalSec,
// so on every tick we only check APIs whose interval has elapsed.
export function startMonitor() {
  const schedule = process.env.CHECK_CRON || "*/1 * * * *";

  cron.schedule(schedule, async () => {
    const apis = await Api.find({ paused: false });
    const due = apis.filter((api) => {
      if (!api.lastCheckedAt) return true;
      const elapsed = (Date.now() - api.lastCheckedAt.getTime()) / 1000;
      return elapsed >= api.checkIntervalSec;
    });

    await Promise.allSettled(due.map(checkOne));
    if (due.length) console.log(`[monitor] checked ${due.length} api(s)`);
  });

  console.log(`[monitor] cron scheduled: ${schedule}`);
}
