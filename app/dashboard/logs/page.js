"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleGuard } from "@/components/AccessControl";
import { 
  FileText, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  XCircle,
  CheckCircle,
  Clock,
  Filter
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const LOG_LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "ERROR", label: "Error" },
  { value: "WARN", label: "Warning" },
  { value: "INFO", label: "Info" },
  { value: "DEBUG", label: "Debug" },
];

const LOG_SOURCES = [
  { value: "all", label: "All Sources" },
  { value: "api", label: "API Routes" },
  { value: "auth", label: "Authentication" },
  { value: "database", label: "Database" },
  { value: "system", label: "System" },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs();
      }, 10000); // Refresh every 10 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (level) => {
    switch (level?.toUpperCase()) {
      case "ERROR":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "WARN":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "INFO":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "DEBUG":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogBadgeVariant = (level) => {
    switch (level?.toUpperCase()) {
      case "ERROR":
        return "destructive";
      case "WARN":
        return "warning";
      case "INFO":
        return "default";
      case "DEBUG":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      !searchTerm ||
      log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesSource = sourceFilter === "all" || log.source === sourceFilter;

    return matchesSearch && matchesLevel && matchesSource;
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <RoleGuard roles={["ADMIN"]}>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground mt-1">
              System logs and activity monitoring from Google Cloud Run
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Clock className="h-4 w-4 mr-2" />
              {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
            </Button>
            <Button onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter logs by level, source, or search term</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Log Entries</CardTitle>
                <CardDescription>
                  {filteredLogs.length} of {logs.length} logs
                </CardDescription>
              </div>
              <Badge variant="outline">
                {autoRefresh ? "Live" : "Static"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading && logs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No logs found matching your filters</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getLogIcon(log.level)}</div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getLogBadgeVariant(log.level)}>
                              {log.level || "INFO"}
                            </Badge>
                            {log.source && (
                              <Badge variant="outline">{log.source}</Badge>
                            )}
                            {log.userId && (
                              <Badge variant="secondary">User: {log.userId}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium break-words">{log.message}</p>
                          {log.httpRequest && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <Badge variant="outline" className="mr-2">
                                {log.httpRequest.method}
                              </Badge>
                              <span className="font-mono">{log.httpRequest.url}</span>
                              {log.httpRequest.status && (
                                <Badge 
                                  variant={log.httpRequest.status < 400 ? "default" : "destructive"}
                                  className="ml-2"
                                >
                                  {log.httpRequest.status}
                                </Badge>
                              )}
                            </div>
                          )}
                          {log.details && (
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer hover:text-foreground">
                                View details
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {typeof log.details === "string"
                                  ? log.details
                                  : JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                          {log.stackTrace && (
                            <details className="text-xs text-red-600">
                              <summary className="cursor-pointer hover:text-red-700">
                                View stack trace
                              </summary>
                              <pre className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-xs overflow-x-auto">
                                {log.stackTrace}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
