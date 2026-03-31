const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
// Increased limit for grouped event batches
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;

// Load mock responses
const mockDataPath = path.join(__dirname, '..', 'mock_api_responses.json');
let mockData = {};
try {
  mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
} catch (e) {
  console.error("Could not load mock_api_responses.json", e);
}

// Analytics Mock DB Layer representing physically separated tenant schemas
let dbCluster = mockData.dbCluster || {};

// --- HOT RELOAD LOGIC ---
// Watch for file changes so the Mock API updates immediately without server restarts
fs.watchFile(mockDataPath, { interval: 500 }, (curr, prev) => {
  if (curr.mtime > prev.mtime) {
    try {
      const rawData = fs.readFileSync(mockDataPath, 'utf8');
      mockData = JSON.parse(rawData);
      dbCluster = mockData.dbCluster || {};
      console.log(`\n[HOT-RELOAD] Detected save! Successfully hot-swapped live database from mock JSON!`);
    } catch(e) {
      console.error(`\n[HOT-RELOAD ERROR] Failed to load JSON (Check for missing commas/quotes):`, e.message);
    }
  }
});
// ------------------------

// Middleware: Strict DB-Level Multi-tenant Enforcement
const requireTenant = (req, res, next) => {
  // Exception for cross-origin preflight
  if (req.method === 'OPTIONS') return next();
  
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(403).json({ error: "Access Denied: Missing x-tenant-id strict boundary check." });
  }
  
  // Attach resolved schema context
  req.tenantContext = dbCluster[tenantId] || dbCluster['TENANT_HDFC']; // fallback
  next();
};

// --- ENDPOINTS ---

app.get('/api/analytics', requireTenant, (req, res) => {
  // DB query isolated to the tenant schema assigned in middleware
  res.json(req.tenantContext); 
});

// Explicit compliance endpoints
app.get('/api/compliance/consent', requireTenant, (req, res) => {
  res.json(mockData.consent_settings || {});
});

app.get('/api/compliance/pii-rules', requireTenant, (req, res) => {
  res.json(mockData.pii_masking_rules || {});
});

app.get('/api/compliance/audit-logs', requireTenant, (req, res) => {
  res.json(mockData.telemetry_audit_logs || {});
});

// Telemetry Batch Ingestion Endpoint (Circuit-Breaker Target)
app.post('/api/telemetry', requireTenant, (req, res) => {
  const { events } = req.body;
  const tenantId = req.headers['x-tenant-id'];

  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: "Invalid payload format. Expected batch { events: [] }" });
  }

  // Simulate PII Masking Pipeline across the batch
  const processTelemetryBatch = (batchList) => {
    const piiRules = mockData.pii_masking_rules?.rules || [];
    
    return batchList.map(event => {
      let safeEvent = { ...event };
      piiRules.forEach(rule => {
        if (safeEvent[rule.field]) {
          if (rule.action === 'mask_full') safeEvent[rule.field] = '*** MASKED ***';
          else if (rule.action === 'mask_partial' && rule.visibleLastChars) {
            const valStr = String(safeEvent[rule.field]);
            const visible = valStr.slice(-rule.visibleLastChars);
            safeEvent[rule.field] = '*'.repeat(Math.max(0, valStr.length - rule.visibleLastChars)) + visible;
          } else if (rule.action === 'hash') safeEvent[rule.field] = '[SHA-256 HASHED]';
          else if (rule.action === 'anonymize_subnet') safeEvent[rule.field] = safeEvent[rule.field].replace(/\.\d+$/, '.xxx');
        }
      });
      return safeEvent;
    });
  };

  const maskedEvents = processTelemetryBatch(events);
  
  console.log(`\n[TELEMETRY SYNC] Received aggregated batch of ${events.length} events from Tenant: ${tenantId}`);
  if (events.length > 0) {
    console.log(`Example Unmasked Ingestion: `, JSON.stringify(events[0]).substring(0, 150) + "...");
    console.log(`Stored Masked Result:     `, JSON.stringify(maskedEvents[0]).substring(0, 150) + "...");
  }
  
  // Real-time KPI update for the tenant segment
  req.tenantContext.kpis.totalEvents += events.length;

  res.status(200).json({ status: 'success', recorded: events.length });
});

app.listen(PORT, () => {
  console.log(`FinSpark V2 Mock Cluster running on http://localhost:${PORT}`);
});
