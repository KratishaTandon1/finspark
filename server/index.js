    const express = require('express');
    const cors = require('cors');
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');

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

    function calculateSegmentation(events) {
      const map = { Retail: 0, Wealth: 0, Corporate: 0 };
      events.forEach(e => {
        const charCode = e.userId ? e.userId.charCodeAt(e.userId.length - 1) : 0;
        if (charCode % 3 === 0) map.Wealth++;
        else if (charCode % 2 === 0) map.Corporate++;
        else map.Retail++;
      });
      return Object.entries(map).map(([segment, count]) => ({ segment, count, fullMark: 150000 }));
    }

    function calculateHeatmap(events) {
      const matrix = {};
      events.forEach(e => {
        if (!e.featureId) return;
        const fId = e.featureId.replace(/([A-Z])/g, ' $1').trim();
        if (!matrix[fId]) matrix[fId] = { web: 0, mobile: 0, api: 0 };
        if (e.channel) matrix[fId][e.channel] = (matrix[fId][e.channel] || 0) + 1;
      });
      
      return Object.entries(matrix)
        .map(([feature, channels]) => ({
          feature,
          web: channels.web,
          mobile: channels.mobile,
          api: channels.api
        }))
        .sort((a, b) => (b.web + b.mobile + b.api) - (a.web + a.mobile + a.api))
        .slice(0, 10); // Take top 10 features for the heatmap to fit nicely
    }

    // DYNAMIC LICENSE GAP
    function calculateLicenseGap(tenantId, events) {
      // Aggregate events by feature
      const featureCounts = {};
      let totalEventVolume = 0;
      
      events.forEach(e => {
        if (e.featureId) {
          const fId = e.featureId.replace(/([A-Z])/g, ' $1').trim();
          featureCounts[fId] = (featureCounts[fId] || 0) + 1;
          totalEventVolume++;
        }
      });

      // Sort features by total usage (ascending) to find the least used ones
      // Threshold-based: only flag features genuinely below minimum usage
      // Dynamically set threshold as 10% of the average feature usage
      const featureValues = Object.values(featureCounts);
      const totalFeaturesUsed = featureValues.length;
      const avgUsage = featureValues.reduce((a, b) => a + b, 0) / totalFeaturesUsed;
      const threshold = Math.max(50, Math.floor(avgUsage * 0.1));

      const allSorted = Object.entries(featureCounts).sort((a, b) => a[1] - b[1]);
      const underUtilizedFeatures = allSorted.filter(([, count]) => count < threshold);
      const underUtilizedCount = underUtilizedFeatures.length;

      const costPerFeature = 12500;

      return {
        totalLicensed: totalFeaturesUsed,
        totalUsed: totalFeaturesUsed - underUtilizedCount,
        unusedCount: underUtilizedCount,
        usedFeatures: Object.keys(featureCounts),
        unusedFeatures: underUtilizedFeatures.map(f => `${f[0]} (${f[1]} events)`),
        utilizationPercent: underUtilizedCount === 0
          ? 100
          : Math.round(((totalFeaturesUsed - underUtilizedCount) / totalFeaturesUsed) * 100),
        wastedSpend: underUtilizedCount * costPerFeature
      };
    }

    function generatePredictiveInsights(tenantId, events, licenseGap) {
      const insights = [];
      if (licenseGap.utilizationPercent >= 80) {
        insights.push({
          type: 'success',
          message: `Excellent adoption for ${tenantId}. Usage is consistent across all features.`
        });
      } else if (licenseGap.wastedSpend > 0) {
        insights.push({
          type: 'danger',
          message: `[FinOps ROI Alert] Bottom ${licenseGap.unusedCount} features have extremely low traffic. Action required to salvage $${licenseGap.wastedSpend.toLocaleString()}/year in underutilized capabilities.`
        });
      }
      return insights;
    }

    function applyPIIMasking(events, tenantId) {
      const rules = mockData.pii_masking_rules?.rules || [];
      if (!mockData.pii_masking_rules?.active || rules.length === 0) return events;
      
      return events.map(e => {
        const maskedEvent = { ...e };
        rules.forEach(rule => {
          if (maskedEvent[rule.field]) {
            if (rule.action === 'mask_full') maskedEvent[rule.field] = '***MASKED***';
            else if (rule.action === 'mask_partial') {
              const val = String(maskedEvent[rule.field] || '');
              maskedEvent[rule.field] = '*'.repeat(Math.max(val.length - (rule.visibleLastChars || 4), 0)) + val.slice(-(rule.visibleLastChars || 4));
            }
            else if (rule.action === 'hash') {
              maskedEvent[rule.field] = crypto.createHash('sha256').update(String(maskedEvent[rule.field])).digest('hex');
            }
            else if (rule.action === 'anonymize_subnet') {
              const parts = String(maskedEvent[rule.field]).split('.');
              if(parts.length === 4) maskedEvent[rule.field] = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
            }
          }
        });
        return maskedEvent;
      });
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
        segmentation: calculateSegmentation(events),
        heatmapMatrix: calculateHeatmap(events),
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
    app.get('/api/compliance/pii-rules', requireTenant, (req, res) => res.json(mockData.pii_masking_rules || {}));
    app.get('/api/compliance/audit-logs', requireTenant, (req, res) => res.json(mockData.telemetry_audit_logs || {}));
    app.post('/api/telemetry', requireTenant, (req, res) => {
      const events = req.body.events || [];
      const maskedEvents = applyPIIMasking(events, req.tenantId);
      console.log(`\n[TELEMETRY] 📥 Received sync from tenant: ${req.tenantId}`);
      if (maskedEvents.length > 0) {
        console.log(`[PII-AUDIT] Active Masking Applied. Sample Event:`, JSON.stringify(maskedEvents[0], null, 2));
      }
      res.status(200).json({ status: 'success' });
    });

    app.post('/api/ingest', requireTenant, (req, res) => {
      const events = req.body.events || [];
      const maskedEvents = applyPIIMasking(events, req.tenantId);
      console.log(`\n[INGEST] 📥 Received manual sync from tenant: ${req.tenantId} with ${events.length} events`);
      if (maskedEvents.length > 0) {
        console.log(`[PII-AUDIT] Active Masking Applied. Sample Event:`, JSON.stringify(maskedEvents[0], null, 2));
      }
      res.status(200).json({ status: 'success' });
    });

    // ─── Start ────────────────────────────────────────────────────────────────────
    app.listen(PORT, () => {
      console.log(`\n🚀 FinSpark Engine running on http://localhost:${PORT}`);
      console.log(`Dynamic Mode: Monitoring ${rawEventsPath} for changes...`);
    });