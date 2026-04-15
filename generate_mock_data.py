import json
import random
from datetime import datetime, timedelta

# Master "Licensed" Feature Pool for each tenant
# This represents what the bank PAYS for.
tenants = {
    "TENANT_HDFC":  ['ApplyLoan','KYC_Upload','CreditScoreCheck','LoanDisbursement','RepaymentTracker','DocumentUpload','FraudAlerts','AuditExport','CoreBankingAPI','EStatements','BulkDisbursement','CollectionModule', 'Legacy_SOAP_API', 'Predictive_AI_Beta'],
    "TENANT_ICICI": ['RetailBanking','WealthDashboard','TransactionSearch','PortfolioRefresh','ExportPDF','FundTransfer','LoanEligibility','CreditCardApply','InsuranceModule','ForexModule', 'Custom_Report_Builder_V1'],
    "TENANT_AMAZON": ['AddToCart', 'ViewProduct', 'Checkout', 'ApplyCoupon', 'TrackOrder', 'ReviewProduct'],
    "TENANT_UBER": ['RequestRide', 'CancelRide', 'RateDriver', 'UpdatePayment', 'CheckFare', 'UpdateProfile', 'Advanced_Analytics'],
    "TENANT_AIRBNB": ['BookStay', 'SearchLocation', 'MessageHost', 'ViewWishlist', 'Host_API_Access']
}

# Master List of intentionally unused features to prove ROI detection organically
unused_features_mock = ['Legacy_SOAP_API', 'Predictive_AI_Beta', 'Custom_Report_Builder_V1', 'Advanced_Analytics', 'Host_API_Access']

channels = ['web', 'mobile', 'api']
deployment_types = ['cloud', 'onPrem']
journey_steps = ['App_Open', 'Dashboard_Load', 'Module_Nav', 'Form_Submit', 'Completion']

events = []
start_date = datetime(2026, 3, 15)
end_date = datetime(2026, 4, 1)

total_events = 150000

for i in range(total_events):
    tenant = random.choice(list(tenants.keys()))
    
    # Select a feature, but aggressively retry if it's supposed to be "Unused"
    # This guarantees the feature exists in the license files but NEVER in the event logs
    feature = random.choice(tenants[tenant])
    while feature in unused_features_mock:
        feature = random.choice(tenants[tenant])
    
    if random.random() < 0.8:
        user_id = f"user_{tenant}_{random.randint(1, 500)}"
    else:
        user_id = f"user_{tenant}_{random.randint(501, 10000)}"
        
    random_seconds = random.randint(0, int((end_date - start_date).total_seconds()))
    event_time = start_date + timedelta(seconds=random_seconds)
    
    events.append({
        "tenantId": tenant,
        "featureId": feature,
        "userId": user_id,
        "channel": random.choice(channels),
        "deploymentType": random.choice(deployment_types),
        "journeyStep": random.choice(journey_steps),
        "timestamp": event_time.strftime("%Y-%m-%dT%H:%M:%SZ")
    })

events.sort(key=lambda x: x["timestamp"])

# 1. Output the Raw Event Stream
with open("mock_raw_events.json", "w") as f:
    json.dump(events, f, indent=2)

print(f"Generated {len(events)} events in mock_raw_events.json")

# 2. Output the Master License Ledger 
# (The backend reads this to know what is actually procured, rather than guessing from traffic)
with open("mock_tenant_licenses.json", "w") as f:
    json.dump(tenants, f, indent=2)

print(f"Generated License Ledger in mock_tenant_licenses.json")
