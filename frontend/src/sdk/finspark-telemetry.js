class FinSparkTelemetry {
  constructor() {
    this.endpoint = "http://localhost:3001/api/telemetry";
    this.deploymentType = "on-premise"; // Simulating on-prem behavior with local sync
    // Default tenant; we will allow the UI to override this for presentation purposes
    this.tenantId = localStorage.getItem('finspark_tenant_id') || "TENANT_HDFC"; 
    
    this.userId = "usr_" + Math.floor(Math.random() * 1000);
    this.consentReceived = true; 
    
    // Batching (Circuit Breaker) Queue
    this.eventQueue = [];
    this.flushIntervalMs = 10000; // Flush every 10 seconds to save bandwidth
    this.isFlushing = false;

    // Bind listeners
    window.addEventListener('click', this._handleInteraction.bind(this));
    
    // Ensure data isn't lost if the user closes the tab
    window.addEventListener('beforeunload', () => {
      if (this.eventQueue.length > 0 && navigator.sendBeacon) {
        const payload = JSON.stringify({ events: this.eventQueue });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(this.endpoint, blob);
        this.eventQueue = []; // Clear queue
      } else {
        this.flush(true);
      }
    });
    
    // Start flush timer
    setInterval(() => this.flush(), this.flushIntervalMs);
  }

  setTenant(tenantId) {
    this.tenantId = tenantId;
    localStorage.setItem('finspark_tenant_id', tenantId);
    console.log(`[SDK] active context switched to tenant: ${tenantId}`);
  }

  setConsent(value) {
    this.consentReceived = value;
    if (!value) {
      this.eventQueue = []; // Clear queue on opt-out
    }
  }

  _handleInteraction(e) {
    if (!this.consentReceived) return;

    // We now look for a taxonomy-structured data-feature attribute
    // Example: "Dashboard:Navigation:Overview"
    const featureTaxonomy = e.target.closest('[data-feature]')?.getAttribute('data-feature');
    if (featureTaxonomy) {
      const parts = featureTaxonomy.split(':');
      
      this.track("Feature_Interaction", {
        taxonomyString: featureTaxonomy,
        module: parts[0] || "Unknown",
        subModule: parts[1] || "Unknown",
        action: parts[2] || "Unknown",
        elementType: e.target.tagName,
        
        // Mocking PII
        customerName: "Sanjay Kumar",
        accountNumber: "000088884444",
        emailAddress: "sanjay.k@hdfc-mock.com",
        ipAddress: "10.0.5.212"
      });
    }
  }

  track(eventName, context = {}) {
    if (!this.consentReceived) return;

    const payload = {
      eventId: "evt_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      eventName,
      userId: this.userId,
      ...context 
    };

    this.eventQueue.push(payload);
    console.debug(`[SDK] Event queued. Current buffer size: ${this.eventQueue.length}`);
    
    // Fallback: If queue gets dangerously large (e.g., 50), flush immediately
    if (this.eventQueue.length >= 50) this.flush();
  }

  async flush(isUnloading = false) {
    if (this.eventQueue.length === 0 || this.isFlushing) return;
    
    this.isFlushing = true;
    const batch = [...this.eventQueue];
    this.eventQueue = []; // Clear queue

    console.log(`[SDK] Syncing bulk data gravity event: Flushing ${batch.length} events to Central Engine...`);

    const headers = {
      "Content-Type": "application/json",
      "x-tenant-id": this.tenantId, // DB Level Isolation enforcement
      "x-deployment-type": this.deploymentType
    };

    try {
      if (isUnloading && navigator.sendBeacon) {
        // Use sendBeacon for clean exit delivery
        const blob = new Blob([JSON.stringify({ events: batch })], { type: 'application/json' });
        navigator.sendBeacon(this.endpoint, blob);
      } else {
        await fetch(this.endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ events: batch })
        });
      }
    } catch (err) {
      console.error("[SDK] Failed to flush events, putting them back in queue", err);
      // Put them back at the start of the queue on failure
      this.eventQueue = [...batch, ...this.eventQueue]; 
    } finally {
      this.isFlushing = false;
    }
  }
}

export const telemetry = new FinSparkTelemetry();
