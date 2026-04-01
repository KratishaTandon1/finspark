const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large mock files

const PORT = process.env.PORT || 3001;

// ─── File Paths ───────────────────────────────────────────────────────────────
const rawEventsPath = path.join(__dirname, '..', 'mock_raw_events.json');
const mockDataPath = path.join(__dirname, '..', 'mock_api_responses.json');

// ─── Global State & Cache ─────────────────────────────────────────────────────
let rawEvents = [];
let mockData = {};
let tenantCache = {}; // Quick access to events by tenantId

function loadFiles() {
  try {
    const rawEventsData = JSON.parse(fs.readFileSync(rawEventsPath, 'utf8'));
    rawEvents = Array.isArray(rawEventsData) ? rawEventsData : (rawEventsData.events || []);

    // BUILD TENANT CACHE (Dynamic extraction of all tenants and features)
    tenantCache = {};
    rawEvents.forEach(e => {
      if (!tenantCache[e.tenantId]) {
        tenantCache[e.tenantId] = {
          events: [],
          features: new Set()
        };
      }
      tenantCache[e.tenantId].events.push(e);
      tenantCache[e.tenantId].features.add(e.featureId);
    });

    console.log(`[BOOT] Loaded ${rawEvents.length} events across ${Object.keys(tenantCache).length} tenants.`);
  } catch (e) {
    console.error('[BOOT] Could not load mock_raw_events.json:', e.message);
  }

  try {
    mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    console.log('[BOOT] Loaded mock_api_responses.json (compliance/PII data).');
  } catch (e) {
    console.error('[BOOT] Could not load mock_api_responses.json:', e.message);
  }
}

loadFiles();

// ─── Hot Reload ───────────────────────────────────────────────────────────────
[rawEventsPath, mockDataPath].forEach(filePath => {
  fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      console.log(`\n[HOT-RELOAD] Detected change in ${path.basename(filePath)}, reloading...`);
      loadFiles();
    }
  });
});

// ─── Dynamic Aggregation Engine ──────────────────────────────────────────────
function getEventsForTenant(tenantId) {
  return tenantCache[tenantId]?.events || [];
}

function getFeaturesForTenant(tenantId) {
  return Array.from(tenantCache[tenantId]?.features || []);
}

function calculateKPIs(events, tenantId) {
  const uniqueUsers = new Set(events.map(e => e.userId)).size;
  return {
    totalEvents: events.length,
    activeUsers: uniqueUsers,
    anonymizedPercent: 99.8,
    licensedSeats: tenantId.includes('HDFC') ? 10000 : 5000
  };
}

function calculateFeatureAdoption(events) {
  const map = {};
  events.forEach(e => {
    if (!map[e.featureId]) map[e.featureId] = { cloud: 0, onPrem: 0 };
    if (e.deploymentType === 'cloud' || e.channel === 'web') map[e.featureId].cloud++;
    else map[e.featureId].onPrem++;
  });
  return Object.entries(map)
    .map(([feature, counts]) => ({ feature: feature.replace(/([A-Z])/g, ' $1').trim(), ...counts }))
    .sort((a, b) => (b.cloud + b.onPrem) - (a.cloud + a.onPrem));
}

function calculateJourneyFunnel(events) {
  const stepOrder = ['App_Open', 'Dashboard_Load', 'Module_Nav', 'Form_Submit', 'Completion'];
  const stepUserMap = {};
  events.forEach(e => {
    if (!stepUserMap[e.journeyStep]) stepUserMap[e.journeyStep] = new Set();
    stepUserMap[e.journeyStep].add(e.userId);
  });
  const totalUsers = new Set(events.map(e => e.userId)).size;
  const funnelBase = {
    App_Open: totalUsers,
    Dashboard_Load: Math.round(totalUsers * 0.92),
    Module_Nav: stepUserMap['Module_Nav'] ? stepUserMap['Module_Nav'].size : 0,
    Form_Submit: stepUserMap['Form_Submit'] ? stepUserMap['Form_Submit'].size : 0,
    Completion: Math.round((stepUserMap['Form_Submit']?.size || 0) * 0.6)
  };
  return stepOrder.map(step => ({
    step: step.replace('_', ' '),
    users: funnelBase[step] || 0
  }));
}

function calculateChannelBreakdown(events) {
  const map = {};
  events.forEach(e => {
    if (e.channel) map[e.channel] = (map[e.channel] || 0) + 1;
  });
  return Object.entries(map).map(([channel, count]) => ({ channel, count }));
}

function calculateDailyTrend(events) {
  const map = {};
  events.forEach(e => {
    if (e.timestamp) {
      const date = e.timestamp.split('T')[0];
      map[date] = (map[date] || 0) + 1;
    }
  });
  return Object.entries(map)
    .map(([date, count]) => ({ date, events: count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);
}

// DYNAMIC LICENSE GAP
function calculateLicenseGap(tenantId, events) {
  const allFeatures = getFeaturesForTenant(tenantId);
  const usedCount = allFeatures.length; // In this dynamic mock, we treat all generated features as active

  return {
    totalLicensed: allFeatures.length,
    totalUsed: usedCount,
    unusedCount: 0,
    usedFeatures: allFeatures,
    unusedFeatures: [],
    utilizationPercent: allFeatures.length ? 100 : 0
  };
}

function generatePredictiveInsights(tenantId, events, licenseGap) {
  const insights = [];
  if (licenseGap.utilizationPercent >= 80) {
    insights.push({
      type: 'success',
      message: `Excellent adoption for ${tenantId}. Usage is consistent across all features.`
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

app.get('/api/tenants', (req, res) => {
  res.json(Object.keys(tenantCache));
});

app.get('/api/dashboard-data', requireTenant, (req, res) => {
  const events = getEventsForTenant(req.tenantId);
  const kpis = calculateKPIs(events, req.tenantId);
  const licenseGap = calculateLicenseGap(req.tenantId, events);

  res.json({
    kpis,
    featureAdoption: calculateFeatureAdoption(events),
    journeyFunnel: calculateJourneyFunnel(events),
    channelBreakdown: calculateChannelBreakdown(events),
    dailyTrend: calculateDailyTrend(events),
    licenseGap,
    predictiveInsights: generatePredictiveInsights(req.tenantId, events, licenseGap)
  });
});

// FULLY DYNAMIC FEATURES ROUTE
app.get('/api/features', requireTenant, (req, res) => {
  const events = getEventsForTenant(req.tenantId);
  const licensed = getFeaturesForTenant(req.tenantId);

  const featureMap = {};
  events.forEach(e => {
    if (!featureMap[e.featureId]) {
      featureMap[e.featureId] = { totalEvents: 0, users: new Set(), channels: {}, deployments: {} };
    }
    featureMap[e.featureId].totalEvents++;
    featureMap[e.featureId].users.add(e.userId);
    if (e.channel) featureMap[e.featureId].channels[e.channel] = (featureMap[e.featureId].channels[e.channel] || 0) + 1;
    if (e.deploymentType) featureMap[e.featureId].deployments[e.deploymentType] = (featureMap[e.featureId].deployments[e.deploymentType] || 0) + 1;
  });

  const features = licensed.map(featureId => {
    const data = featureMap[featureId];
    return {
      featureId,
      // Dynamic status based on the 1.5L events scale
      status: data.totalEvents > 4000 ? 'hot' : data.totalEvents > 1500 ? 'warm' : 'cold',
      totalEvents: data.totalEvents,
      uniqueUsers: data.users.size,
      channels: data.channels,
      deployments: data.deployments
    };
  });

  res.json({ features });
});

// Compliance & Telemetry (keeping your original logic)
app.get('/api/compliance/consent', requireTenant, (req, res) => res.json(mockData.consent_settings || {}));
app.post('/api/telemetry', requireTenant, (req, res) => res.status(200).json({ status: 'success' }));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FinSpark Engine running on http://localhost:${PORT}`);
  console.log(`Dynamic Mode: Monitoring ${rawEventsPath} for changes...`);
});