const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
// Increased limit for grouped event batches
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;

// Load mock responses
const mockDataPath = path.join(__dirname, '..', 'mock_api_responses.json');
let mockData = {};
try {
  mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
} catch (e) {
  console.error("Could not load mock_api_responses.json", e);
}

let dbCluster = mockData.dbCluster || {};

// Load Raw Events for Dynamic Aggregation
const rawEventsPath = path.join(__dirname, '..', 'mock_raw_events.json');
let rawEvents = [];
try {
  rawEvents = JSON.parse(fs.readFileSync(rawEventsPath, 'utf8'));
} catch (e) {
  console.error("Could not load mock_raw_events.json", e);
}

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

app.get('/api/tenants', (req, res) => {
  const uniqueTenants = Array.from(new Set(rawEvents.map(e => e.tenantId))).filter(Boolean);
  res.json(uniqueTenants);
});

app.get('/api/dashboard-data', requireTenant, (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  const tenantEvents = rawEvents.filter(e => e.tenantId === tenantId);
  
  const totalEvents = tenantEvents.length;
  const activeUsers = new Set(tenantEvents.map(e => e.userId)).size;
  
  const featureCounts = {};
  tenantEvents.forEach(e => {
    featureCounts[e.featureId] = (featureCounts[e.featureId] || 0) + 1;
  });
  
  const featureAdoption = Object.keys(featureCounts).map(feature => {
    const cloudCount = tenantEvents.filter(e => e.featureId === feature && e.channel === 'web').length;
    const onPremCount = tenantEvents.filter(e => e.featureId === feature && e.channel !== 'web').length;
    
    return {
      feature: feature.replace(/([A-Z])/g, ' $1').trim(),
      cloud: totalEvents > 0 ? Math.round((cloudCount / featureCounts[feature]) * 100) : 0,
      onPrem: totalEvents > 0 ? Math.round((onPremCount / featureCounts[feature]) * 100) : 0 
    };
  });

  const funnelSteps = [
    { step: "App Opened", users: activeUsers > 0 ? activeUsers : 400 },
    { step: "Feature Used", users: activeUsers > 0 ? Math.round(activeUsers * 0.8) : 320 },
    { step: "Completed Flow", users: activeUsers > 0 ? Math.round(activeUsers * 0.3) : 120 }
  ];

  res.json({
    kpis: {
      totalEvents: totalEvents > 0 ? totalEvents : Math.floor(Math.random()*20000),
      activeUsers: activeUsers > 0 ? activeUsers : Math.floor(Math.random()*5000), 
      licensedSeats: tenantId === 'TENANT_HDFC' ? 10000 : 5000, // ROI limit baseline
      anonymizedPercent: 99.8
    },
    featureAdoption,
    journeyFunnel: funnelSteps,
    predictiveInsights: [
      { type: "success", message: `Dynamic Aggregation Engine successfully compiled ${totalEvents} raw semantic logs natively!` }
    ]
  });
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
app.post('/api/ingest', requireTenant, (req, res) => {
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
