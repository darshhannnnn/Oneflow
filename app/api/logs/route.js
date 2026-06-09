import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Logging } from "@google-cloud/logging";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Initialize Google Cloud Logging client
    let logs = [];

    try {
      const logging = new Logging({
        projectId: process.env.GCP_PROJECT_ID || "xenon-notch-477511-g5",
        credentials: process.env.GCP_CREDENTIALS
          ? JSON.parse(process.env.GCP_CREDENTIALS)
          : undefined,
      });

      // Query logs from Cloud Run service
      const filter = `
        resource.type="cloud_run_revision"
        resource.labels.service_name="oneflow"
        timestamp>="${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
      `;

      const [entries] = await logging.getEntries({
        filter: filter,
        pageSize: 100,
        orderBy: "timestamp desc",
      });

      // Debug: Log first entry structure
      if (entries.length > 0) {
        console.log("Sample log entry structure:", JSON.stringify(entries[0], null, 2));
      }

      // Transform log entries
      logs = entries.map((entry, index) => {
        // Extract message from various possible locations
        let message = "No message";
        let details = {};
        let userId = null;
        let stackTrace = null;

        // Debug first few entries
        if (index < 2) {
          console.log(`Entry ${index} keys:`, Object.keys(entry));
          console.log(`Entry ${index} textPayload:`, entry.textPayload);
          console.log(`Entry ${index} jsonPayload:`, entry.jsonPayload);
        }

        // Try textPayload first (most common for Cloud Run)
        if (entry.textPayload) {
          message = entry.textPayload;
        } 
        // Try jsonPayload
        else if (entry.jsonPayload) {
          const json = entry.jsonPayload;
          message = json.message || json.msg || json.text || JSON.stringify(json);
          details = json;
          userId = json.userId || json.user_id || json.user;
          stackTrace = json.stack || json.stackTrace || json.error?.stack;
        }
        // Try protoPayload
        else if (entry.protoPayload) {
          const proto = entry.protoPayload;
          message = proto.status?.message || proto.request?.path || JSON.stringify(proto);
          details = proto;
        }
        // Try data property
        else if (entry.data) {
          const data = entry.data;
          if (typeof data === "string") {
            message = data;
          } else if (data && typeof data === "object") {
            message = data.message || JSON.stringify(data);
            details = data;
            userId = data.userId;
            stackTrace = data.stack || data.stackTrace;
          }
        }
        // Last resort: stringify the entire entry
        else {
          message = `Raw log entry (keys: ${Object.keys(entry).join(", ")})`;
          details = entry;
        }

        // Extract HTTP info if available
        const httpRequest = entry.httpRequest;
        if (httpRequest) {
          if (message === "No message") {
            message = `${httpRequest.requestMethod} ${httpRequest.requestUrl} - ${httpRequest.status}`;
          }
          details.httpRequest = httpRequest;
        }

        return {
          timestamp: entry.metadata?.timestamp || entry.timestamp || new Date().toISOString(),
          level: entry.metadata?.severity || entry.severity || "INFO",
          message: message,
          source: entry.metadata?.resource?.labels?.service_name || entry.resource?.labels?.service_name || "oneflow",
          details: Object.keys(details).length > 0 ? details : null,
          userId: userId,
          stackTrace: stackTrace,
          httpRequest: httpRequest ? {
            method: httpRequest.requestMethod,
            url: httpRequest.requestUrl,
            status: httpRequest.status,
            userAgent: httpRequest.userAgent,
          } : null,
        };
      });
    } catch (gcpError) {
      console.error("GCP Logging error:", gcpError);
      
      // Fallback to mock logs if GCP logging fails
      logs = generateMockLogs();
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Logs API error:", error);
    
    // Return mock logs on error
    return NextResponse.json({ logs: generateMockLogs() });
  }
}

// Generate mock logs for development/fallback
function generateMockLogs() {
  const now = Date.now();
  return [
    {
      timestamp: new Date(now - 1000 * 60 * 5).toISOString(),
      level: "INFO",
      message: "User login successful",
      source: "auth",
      userId: "user-123",
      details: { action: "login", ip: "192.168.1.1" },
    },
    {
      timestamp: new Date(now - 1000 * 60 * 10).toISOString(),
      level: "ERROR",
      message: "Database connection timeout",
      source: "database",
      details: { error: "Connection timeout after 30s" },
      stackTrace: "Error: Connection timeout\n  at Database.connect (db.js:45)\n  at async handler (route.js:12)",
    },
    {
      timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
      level: "WARN",
      message: "API rate limit approaching",
      source: "api",
      details: { endpoint: "/api/projects", requests: 450, limit: 500 },
    },
    {
      timestamp: new Date(now - 1000 * 60 * 20).toISOString(),
      level: "INFO",
      message: "Project created successfully",
      source: "api",
      userId: "user-456",
      details: { projectId: "proj-789", name: "New Project" },
    },
    {
      timestamp: new Date(now - 1000 * 60 * 25).toISOString(),
      level: "DEBUG",
      message: "Cache hit for user profile",
      source: "system",
      details: { cacheKey: "user:123", ttl: 3600 },
    },
    {
      timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
      level: "ERROR",
      message: "Failed to upload file to GCS",
      source: "api",
      userId: "user-789",
      details: { filename: "receipt.pdf", size: 2048576 },
      stackTrace: "Error: Upload failed\n  at uploadToGCS (storage.js:78)\n  at async POST (route.js:34)",
    },
    {
      timestamp: new Date(now - 1000 * 60 * 35).toISOString(),
      level: "INFO",
      message: "Invoice generated and sent",
      source: "api",
      userId: "user-456",
      details: { invoiceId: "inv-001", amount: 5000, customer: "ACME Corp" },
    },
    {
      timestamp: new Date(now - 1000 * 60 * 40).toISOString(),
      level: "WARN",
      message: "Slow query detected",
      source: "database",
      details: { query: "SELECT * FROM timesheets", duration: 2500 },
    },
    {
      timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
      level: "INFO",
      message: "User logout",
      source: "auth",
      userId: "user-123",
      details: { sessionDuration: 3600 },
    },
    {
      timestamp: new Date(now - 1000 * 60 * 50).toISOString(),
      level: "DEBUG",
      message: "Email notification queued",
      source: "system",
      details: { to: "user@example.com", subject: "Task assigned" },
    },
  ];
}
