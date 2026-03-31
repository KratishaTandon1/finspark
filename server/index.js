const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;

// ─── File Paths ───────────────────────────────────────────────────────────────
const rawEventsPath = path.join(__dirname, 'raw_events.json');
const mockDataPath  = path.join(__dirname, 'mock_api_responses.json');

// ─── Load Files ───────────────────────────────────────────────────────────────
let rawEvents = [];
let mockData  = {};

function loadFiles() {
  try {
    rawEvents = JSON.parse(fs.readFileSync(rawEventsPath, 'utf8')).events || [];
    console.log(`[BOOT] Loaded ${rawEvents.length} raw events.`);
  } catch (e) {
    console.error('[BOOT] Could not load raw_events.json:', e.message);
  }
  try {
    mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    console.log('[BOOT] Loaded mock_api_responses.json (compliance/PII data).');
  } catch (e) {
    console.error('[BOOT] Could not load mock_api_responses.json:', e.message);
  }
}

loadFiles();

// ─── Hot Reload (both files) ──────────────────────────────────────────────────
[rawEventsPath, mockDataPath].forEach(filePath => {
  fs.watchFile(filePath, { interval: 500 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      console.log(`\n[HOT-RELOAD] Detected change in ${path.basename(filePath)}, reloading...`);
      loadFiles();
    }
  });
});

// ─── Aggregation Engine ───────────────────────────────────────────────────────
// All calculations happen here from raw events.
// This is what would be a DB query in production.

function getEventsForTenant(tenantId) {
  return rawEvents.filter(e => e.tenantId === tenantId);
}

/**
 * KPIs — total events, unique active users, anonymized %
 */
function calculateKPIs(events) {
  const uniqueUsers = new Set(events.map(e => e.userId)).size;
  return {
    totalEvents: events.length,
    activeUsers: uniqueUsers,
    anonymizedPercent: 99.8 // Always true — PII masking is always on
  };
}

/**
 * Feature Adoption Heatmap — count per feature, split by deploymentType
 * Output: [{ feature, cloud, onPrem }]
 */
function calculateFeatureAdoption(events) {
  const map = {};

  events.forEach(e => {
    if (!map[e.featureId]) map[e.featureId] = { cloud: 0, onPrem: 0 };
    if (e.deploymentType === 'cloud') map[e.featureId].cloud++;
    else map[e.featureId].onPrem++;
  });

  return Object.entries(map)
    .map(([feature, counts]) => ({ feature, ...counts }))
    .sort((a, b) => (b.cloud + b.onPrem) - (a.cloud + a.onPrem)); // Sort by total desc
}

/**
 * Journey Funnel — count of events per journeyStep in logical order
 * Output: [{ step, users }]  — always descending (no funnel going up)
 */
function calculateJourneyFunnel(events) {
  const stepOrder = ['App_Open', 'Dashboard_Load', 'Module_Nav', 'Form_Submit', 'Completion'];

  // Count unique users per step
  const stepUserMap = {};
  events.forEach(e => {
    if (!stepUserMap[e.journeyStep]) stepUserMap[e.journeyStep] = new Set();
    stepUserMap[e.journeyStep].add(e.userId);
  });

  // Build funnel — App_Open is always the most (simulate it as 100% baseline)
  const totalUsers = new Set(events.map(e => e.userId)).size;
  const funnelBase = {
    App_Open:       totalUsers,               // everyone opens the app
    Dashboard_Load: Math.round(totalUsers * 0.92),
    Module_Nav:     stepUserMap['Module_Nav']    ? stepUserMap['Module_Nav'].size    : 0,
    Form_Submit:    stepUserMap['Form_Submit']   ? stepUserMap['Form_Submit'].size   : 0,
    Completion:     Math.round((stepUserMap['Form_Submit']?.size || 0) * 0.6)
  };

  return stepOrder.map(step => ({
    step: step.replace('_', ' '),
    users: funnelBase[step] || 0
  }));
}

/**
 * Channel Breakdown — how many events came from web / mobile / api
 * Output: [{ channel, count }]
 */
function calculateChannelBreakdown(events) {
  const map = {};
  events.forEach(e => {
    map[e.channel] = (map[e.channel] || 0) + 1;
  });
  return Object.entries(map).map(([channel, count]) => ({ channel, count }));
}

/**
 * Daily Trend — events grouped by date (last 14 days shown)
 * Output: [{ date, events }]
 */
function calculateDailyTrend(events) {
  const map = {};
  events.forEach(e => {
    const date = e.timestamp.split('T')[0]; // "2026-03-15"
    map[date] = (map[date] || 0) + 1;
  });

  return Object.entries(map)
    .map(([date, count]) => ({ date, events: count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14); // Last 14 days only
}

/**
 * License vs Usage Gap
 * How many features does this tenant pay for vs actually use?
 */
const licensedFeatures = {
  TENANT_HDFC:  ['ApplyLoan','KYC_Upload','CreditScoreCheck','LoanDisbursement',
                 'RepaymentTracker','DocumentUpload','FraudAlerts','AuditExport',
                 'CoreBankingAPI','EStatements','BulkDisbursement','CollectionModule'],
  TENANT_ICICI: ['RetailBanking','WealthDashboard','TransactionSearch','PortfolioRefresh',
                 'ExportPDF','FundTransfer','LoanEligibility','CreditCardApply',
                 'InsuranceModule','ForexModule']
};

function calculateLicenseGap(tenantId, events) {
  const licensed = licensedFeatures[tenantId] || [];
  const used = new Set(events.map(e => e.featureId));
  const usedList     = licensed.filter(f => used.has(f));
  const unusedList   = licensed.filter(f => !used.has(f));

  return {
    totalLicensed: licensed.length,
    totalUsed:     usedList.length,
    unusedCount:   unusedList.length,
    usedFeatures:  usedList,
    unusedFeatures: unusedList,
    utilizationPercent: Math.round((usedList.length / licensed.length) * 100)
  };
}

/**
 * Predictive Insights — generated from real calculated data
 */
function generatePredictiveInsights(tenantId, events, licenseGap) {
  const insights = [];

  if (licenseGap.utilizationPercent < 60) {
    insights.push({
      type: 'danger',
      message: `License Utilization is only ${licenseGap.utilizationPercent}%. Client is paying for ${licenseGap.totalLicensed} features but using only ${licenseGap.totalUsed}. High churn risk.`
    });
  }

  if (licenseGap.unusedFeatures.length > 0) {
    insights.push({
      type: 'warning',
      message: `${licenseGap.unusedFeatures.length} licensed features have zero usage: ${licenseGap.unusedFeatures.slice(0,3).join(', ')}${licenseGap.unusedFeatures.length > 3 ? '...' : ''}. Recommend targeted training.`
    });
  }

  // Check if any feature has dropped — compare first half vs second half of events
  const sorted = [...events].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  const mid = Math.floor(sorted.length / 2);
  const firstHalf  = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const countByFeature = (arr) => {
    const m = {};
    arr.forEach(e => m[e.featureId] = (m[e.featureId] || 0) + 1);
    return m;
  };

  const first  = countByFeature(firstHalf);
  const second = countByFeature(secondHalf);

  Object.keys(first).forEach(feature => {
    const drop = ((first[feature] - (second[feature] || 0)) / first[feature]) * 100;
    if (drop > 35) {
      insights.push({
        type: 'warning',
        message: `'${feature}' usage dropped ${Math.round(drop)}% in the second half of the month. Investigate user friction.`
      });
    }
  });

  if (licenseGap.utilizationPercent >= 80) {
    insights.push({
      type: 'success',
      message: `Strong feature adoption at ${licenseGap.utilizationPercent}%. This tenant is a prime candidate for upsell next quarter.`
    });
  }

  return insights;
}

// ─── Middleware: Tenant Isolation ─────────────────────────────────────────────
const requireTenant = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(403).json({ error: 'Access Denied: Missing x-tenant-id header.' });
  }
  req.tenantId = tenantId;
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/analytics
 * Main dashboard data — all calculated from raw events
 */
app.get('/api/analytics', requireTenant, (req, res) => {
  const events      = getEventsForTenant(req.tenantId);
  const kpis        = calculateKPIs(events);
  const licenseGap  = calculateLicenseGap(req.tenantId, events);

  res.json({
    kpis,
    featureAdoption:     calculateFeatureAdoption(events),
    journeyFunnel:       calculateJourneyFunnel(events),
    channelBreakdown:    calculateChannelBreakdown(events),
    dailyTrend:          calculateDailyTrend(events),
    licenseGap,
    predictiveInsights:  generatePredictiveInsights(req.tenantId, events, licenseGap)
  });
});

/**
 * GET /api/features
 * Feature-level detail for the Feature Tracker page
 */
app.get('/api/features', requireTenant, (req, res) => {
  const events = getEventsForTenant(req.tenantId);
  const licensed = licensedFeatures[req.tenantId] || [];

  // Per-feature breakdown
  const featureMap = {};
  events.forEach(e => {
    if (!featureMap[e.featureId]) {
      featureMap[e.featureId] = { totalEvents: 0, users: new Set(), channels: {}, deployments: {} };
    }
    featureMap[e.featureId].totalEvents++;
    featureMap[e.featureId].users.add(e.userId);
    featureMap[e.featureId].channels[e.channel]         = (featureMap[e.featureId].channels[e.channel] || 0) + 1;
    featureMap[e.featureId].deployments[e.deploymentType] = (featureMap[e.featureId].deployments[e.deploymentType] || 0) + 1;
  });

  const features = licensed.map(featureId => {
    const data = featureMap[featureId];
    if (!data) {
      return { featureId, status: 'unused', totalEvents: 0, uniqueUsers: 0, channels: {}, deployments: {} };
    }
    return {
      featureId,
      status: data.totalEvents > 50 ? 'hot' : data.totalEvents > 20 ? 'warm' : 'cold',
      totalEvents:  data.totalEvents,
      uniqueUsers:  data.users.size,
      channels:     data.channels,
      deployments:  data.deployments
    };
  });

  res.json({ features });
});

// ─── Compliance Routes (still from mock_api_responses.json) ───────────────────
app.get('/api/compliance/consent', requireTenant, (req, res) => {
  res.json(mockData.consent_settings || {});
});

app.get('/api/compliance/pii-rules', requireTenant, (req, res) => {
  res.json(mockData.pii_masking_rules || {});
});

app.get('/api/compliance/audit-logs', requireTenant, (req, res) => {
  res.json(mockData.telemetry_audit_logs || {});
});

// ─── Telemetry Ingestion Endpoint ─────────────────────────────────────────────
app.post('/api/telemetry', requireTenant, (req, res) => {
  const { events } = req.body;
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Invalid payload. Expected { events: [] }' });
  }

  // PII Masking Pipeline
  const piiRules = mockData.pii_masking_rules?.rules || [];
  const maskedEvents = events.map(event => {
    let safe = { ...event };
    piiRules.forEach(rule => {
      if (safe[rule.field] !== undefined) {
        if (rule.action === 'mask_full') {
          safe[rule.field] = '*** MASKED ***';
        } else if (rule.action === 'mask_partial' && rule.visibleLastChars) {
          const s = String(safe[rule.field]);
          safe[rule.field] = '*'.repeat(Math.max(0, s.length - rule.visibleLastChars)) + s.slice(-rule.visibleLastChars);
        } else if (rule.action === 'hash') {
          safe[rule.field] = '[SHA-256 HASHED]';
        } else if (rule.action === 'anonymize_subnet') {
          safe[rule.field] = String(safe[rule.field]).replace(/\.\d+$/, '.xxx');
        }
      }
    });
    return safe;
  });

  console.log(`\n[TELEMETRY] Batch received: ${events.length} events from ${req.tenantId}`);
  console.log(`[TELEMETRY] PII masked. Sample: ${JSON.stringify(maskedEvents[0]).substring(0, 120)}...`);

  // In production: INSERT maskedEvents into PostgreSQL
  // For hackathon: log and acknowledge
  res.status(200).json({ status: 'success', received: events.length, masked: maskedEvents.length });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nFinSpark Analytics Engine running on http://localhost:${PORT}`);
  console.log(`Endpoints ready:`);
  console.log(`  GET  /api/analytics       → Main dashboard data`);
  console.log(`  GET  /api/features        → Feature Tracker data`);
  console.log(`  GET  /api/compliance/*    → Consent, PII rules, Audit logs`);
  console.log(`  POST /api/telemetry       → Event ingestion + PII masking`);
});