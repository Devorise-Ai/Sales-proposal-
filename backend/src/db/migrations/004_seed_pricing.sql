-- 004_seed_pricing.sql
-- Seed all industries, modules, and pricing config from the SDLC spec

-- ═══════════════════════════════════════════════════════
-- PRICING CONFIG (key-value global settings)
-- ═══════════════════════════════════════════════════════

INSERT INTO pricing_config (key, value, description) VALUES
    ('exchange_rate_usd',      1.41,    'JOD to USD conversion rate'),
    ('tax_rate',               0.16,    'Tax multiplier (16%)'),
    ('system_creation_fee',    5000.00, 'System Creation one-time fee in JOD'),
    ('bulk_messaging_monthly', 100.00,  'Bulk Messaging add-on monthly in JOD');

-- ═══════════════════════════════════════════════════════
-- INDUSTRIES
-- ═══════════════════════════════════════════════════════

INSERT INTO industries (id, name, theme_color, narrative, roi, sort_order) VALUES
(
    'ai_rnd',
    'AI R&D Labs',
    '#007C8A',
    'Accelerate your research and development pipeline with AI-powered automation. From experiment tracking to model deployment, our solutions streamline the entire R&D lifecycle.',
    'Reduce R&D cycle time by up to 40% and increase experiment throughput by 3x with automated pipelines and intelligent resource allocation.',
    1
),
(
    'fintech',
    'FinTech & Banking',
    '#00B4D8',
    'Transform financial operations with intelligent automation. Our AI agents handle fraud detection, risk assessment, and customer service — reducing operational costs while improving accuracy.',
    'Achieve up to 60% reduction in fraud losses and 45% faster loan processing with AI-driven decision engines.',
    2
),
(
    'healthcare',
    'Healthcare & Life Sciences',
    '#06D6A0',
    'Revolutionize patient care and clinical operations with AI. From diagnostic assistance to administrative automation, our solutions enhance outcomes while reducing provider burden.',
    'Improve diagnostic accuracy by 35% and reduce administrative overhead by 50% with intelligent clinical workflows.',
    3
),
(
    'retail',
    'Retail & E-Commerce',
    '#FF6B6B',
    'Deliver personalized shopping experiences at scale with AI-powered recommendation engines, inventory optimization, and customer engagement automation.',
    'Increase average order value by 25% and reduce inventory carrying costs by 30% with predictive AI models.',
    4
),
(
    'manufacturing',
    'Manufacturing & Supply Chain',
    '#FFD93D',
    'Optimize production lines and supply chains with predictive maintenance, quality control AI, and intelligent logistics planning.',
    'Reduce unplanned downtime by 45% and improve supply chain efficiency by 35% with AI-driven predictive analytics.',
    5
),
(
    'education',
    'Education & EdTech',
    '#A78BFA',
    'Transform learning experiences with AI-powered adaptive content, automated assessment, and intelligent tutoring systems that personalize education at scale.',
    'Improve student engagement by 40% and reduce grading workload by 60% with AI-assisted educational tools.',
    6
),
(
    'real_estate',
    'Real Estate & PropTech',
    '#F97316',
    'Modernize real estate operations with AI-driven property valuation, lead qualification, and automated document processing for faster deal closures.',
    'Accelerate deal closure by 30% and improve valuation accuracy by 25% with AI-powered property analytics.',
    7
),
(
    'logistics',
    'Logistics & Transportation',
    '#14B8A6',
    'Optimize routing, fleet management, and warehouse operations with AI-powered logistics solutions that reduce costs and improve delivery performance.',
    'Cut delivery costs by 20% and improve on-time performance by 35% with intelligent route optimization.',
    8
);

-- ═══════════════════════════════════════════════════════
-- MODULES — AI R&D Labs
-- ═══════════════════════════════════════════════════════

INSERT INTO modules (id, industry_id, name, description, setup_price_jod, monthly_price_jod, efficiency, sort_order) VALUES
('ai_rnd_experiment_tracking',    'ai_rnd', 'Experiment Tracking Agent',     'Automated tracking and versioning of ML experiments, hyperparameters, and results with intelligent comparison and recommendation engine.', 3500, 800, 35, 1),
('ai_rnd_model_deployment',       'ai_rnd', 'Model Deployment Pipeline',     'End-to-end automated model deployment with A/B testing, canary releases, and rollback capabilities powered by AI decision-making.', 5000, 1200, 40, 2),
('ai_rnd_data_pipeline',          'ai_rnd', 'Data Pipeline Orchestrator',    'Intelligent data ingestion, transformation, and quality monitoring with auto-healing pipelines and anomaly detection.', 4000, 900, 30, 3),
('ai_rnd_research_assistant',     'ai_rnd', 'Research Assistant Agent',      'AI-powered literature review, paper summarization, and research gap identification to accelerate discovery cycles.', 2500, 600, 25, 4),
('ai_rnd_compute_optimizer',      'ai_rnd', 'Compute Resource Optimizer',    'Dynamic allocation and optimization of GPU/TPU resources across training jobs with cost prediction and spot instance management.', 3000, 700, 20, 5);

-- ═══════════════════════════════════════════════════════
-- MODULES — FinTech & Banking
-- ═══════════════════════════════════════════════════════

INSERT INTO modules (id, industry_id, name, description, setup_price_jod, monthly_price_jod, efficiency, sort_order) VALUES
('fintech_fraud_detection',       'fintech', 'Fraud Detection Agent',         'Real-time transaction monitoring with multi-layered AI models that detect and prevent fraudulent activities with 99.7% accuracy.', 6000, 1500, 40, 1),
('fintech_risk_assessment',       'fintech', 'Risk Assessment Engine',        'Automated credit scoring and risk profiling using alternative data sources and explainable AI for regulatory compliance.', 5500, 1300, 35, 2),
('fintech_customer_service',      'fintech', 'Customer Service AI',           'Intelligent chatbot with natural language understanding for account inquiries, dispute resolution, and product recommendations.', 3000, 700, 25, 3),
('fintech_compliance_monitor',    'fintech', 'Compliance Monitor',            'Automated regulatory compliance checking, AML/KYC screening, and suspicious activity reporting with audit trail generation.', 4500, 1100, 30, 4),
('fintech_portfolio_optimizer',   'fintech', 'Portfolio Optimization Agent',  'AI-driven portfolio rebalancing, market sentiment analysis, and personalized investment recommendations.', 5000, 1200, 25, 5);

-- ═══════════════════════════════════════════════════════
-- MODULES — Healthcare & Life Sciences
-- ═══════════════════════════════════════════════════════

INSERT INTO modules (id, industry_id, name, description, setup_price_jod, monthly_price_jod, efficiency, sort_order) VALUES
('healthcare_diagnostic_assist',  'healthcare', 'Diagnostic Assistant',         'AI-powered diagnostic support with image analysis, symptom correlation, and evidence-based recommendation engine for clinical decision-making.', 7000, 1800, 40, 1),
('healthcare_patient_engagement', 'healthcare', 'Patient Engagement Agent',     'Automated appointment scheduling, medication reminders, follow-up management, and personalized health content delivery.', 3000, 700, 25, 2),
('healthcare_clinical_docs',      'healthcare', 'Clinical Documentation AI',    'Automated medical transcription, structured note generation, and ICD coding assistance to reduce documentation burden.', 4500, 1100, 35, 3),
('healthcare_drug_interaction',   'healthcare', 'Drug Interaction Checker',     'Real-time medication interaction analysis and alternative suggestion engine with evidence-based pharmacological database.', 3500, 800, 20, 4),
('healthcare_admin_automation',   'healthcare', 'Administrative Automation',    'Insurance verification, claims processing, prior authorization automation, and revenue cycle optimization.', 4000, 900, 30, 5);

-- ═══════════════════════════════════════════════════════
-- MODULES — Retail & E-Commerce
-- ═══════════════════════════════════════════════════════

INSERT INTO modules (id, industry_id, name, description, setup_price_jod, monthly_price_jod, efficiency, sort_order) VALUES
('retail_recommendation',         'retail', 'Recommendation Engine',         'Personalized product recommendations using collaborative filtering and deep learning models trained on browsing and purchase history.', 4000, 900, 35, 1),
('retail_inventory_optimizer',    'retail', 'Inventory Optimization AI',     'Demand forecasting, automatic reorder point calculation, and dead stock prediction to optimize inventory across channels.', 5000, 1200, 40, 2),
('retail_customer_insights',      'retail', 'Customer Insights Agent',       'Customer segmentation, lifetime value prediction, churn analysis, and behavioral pattern recognition for targeted marketing.', 3500, 800, 25, 3),
('retail_pricing_engine',         'retail', 'Dynamic Pricing Engine',        'Real-time competitive price monitoring, elasticity modeling, and automated price optimization for maximum margin.', 4500, 1000, 30, 4),
('retail_visual_search',          'retail', 'Visual Search & Discovery',     'Image-based product search, visual similarity matching, and AR-powered try-before-you-buy experiences.', 3000, 700, 20, 5);

-- ═══════════════════════════════════════════════════════
-- MODULES — Manufacturing & Supply Chain
-- ═══════════════════════════════════════════════════════

INSERT INTO modules (id, industry_id, name, description, setup_price_jod, monthly_price_jod, efficiency, sort_order) VALUES
('mfg_predictive_maintenance',    'manufacturing', 'Predictive Maintenance AI',   'IoT sensor data analysis with machine learning models that predict equipment failures before they occur, scheduling proactive maintenance.', 6000, 1400, 40, 1),
('mfg_quality_control',           'manufacturing', 'Quality Control Vision',      'Computer vision-powered defect detection on production lines with real-time alerts and root cause analysis.', 5000, 1200, 35, 2),
('mfg_supply_chain_optimizer',    'manufacturing', 'Supply Chain Optimizer',      'End-to-end supply chain visibility with demand sensing, supplier risk assessment, and logistics optimization.', 4500, 1100, 30, 3),
('mfg_production_scheduler',      'manufacturing', 'Production Scheduler AI',     'Intelligent production planning with constraint optimization, changeover minimization, and dynamic rescheduling.', 4000, 900, 25, 4),
('mfg_energy_optimizer',          'manufacturing', 'Energy Consumption Optimizer', 'AI-driven energy monitoring and optimization across production facilities with carbon footprint tracking and reduction recommendations.', 3500, 800, 20, 5);

-- ═══════════════════════════════════════════════════════
-- MODULES — Education & EdTech
-- ═══════════════════════════════════════════════════════

INSERT INTO modules (id, industry_id, name, description, setup_price_jod, monthly_price_jod, efficiency, sort_order) VALUES
('edu_adaptive_learning',         'education', 'Adaptive Learning Engine',     'Personalized learning paths that adjust difficulty, content type, and pace based on individual student performance and learning style.', 4000, 900, 35, 1),
('edu_auto_assessment',           'education', 'Automated Assessment AI',      'Intelligent grading for essays, code assignments, and open-ended responses with detailed feedback generation.', 3000, 700, 30, 2),
('edu_tutoring_agent',            'education', 'AI Tutoring Agent',            'On-demand virtual tutoring with natural language interaction, step-by-step problem solving, and concept explanation.', 3500, 800, 25, 3),
('edu_content_generator',         'education', 'Content Generation AI',        'Automated quiz generation, lesson plan creation, and educational content adaptation across different difficulty levels.', 2500, 600, 20, 4),
('edu_analytics_dashboard',       'education', 'Learning Analytics Dashboard', 'Comprehensive analytics on student engagement, performance trends, at-risk identification, and intervention recommendations.', 3000, 700, 25, 5);

-- ═══════════════════════════════════════════════════════
-- MODULES — Real Estate & PropTech
-- ═══════════════════════════════════════════════════════

INSERT INTO modules (id, industry_id, name, description, setup_price_jod, monthly_price_jod, efficiency, sort_order) VALUES
('re_property_valuation',         'real_estate', 'Property Valuation AI',       'Automated property valuation using comparable sales analysis, market trends, and neighborhood data with confidence scoring.', 4500, 1000, 35, 1),
('re_lead_qualification',         'real_estate', 'Lead Qualification Agent',    'AI-powered lead scoring, qualification, and nurturing automation with personalized property matching and outreach.', 3000, 700, 30, 2),
('re_document_processing',        'real_estate', 'Document Processing AI',      'Automated extraction and validation of property documents, contracts, and title deeds with compliance checking.', 3500, 800, 25, 3),
('re_virtual_staging',            'real_estate', 'Virtual Staging & Tours',     'AI-generated virtual staging of empty properties and interactive 3D tour creation for enhanced online listings.', 4000, 900, 20, 4),
('re_market_analytics',           'real_estate', 'Market Analytics Engine',     'Real-time market trend analysis, price prediction, and investment opportunity identification with neighborhood scoring.', 3500, 800, 25, 5);

-- ═══════════════════════════════════════════════════════
-- MODULES — Logistics & Transportation
-- ═══════════════════════════════════════════════════════

INSERT INTO modules (id, industry_id, name, description, setup_price_jod, monthly_price_jod, efficiency, sort_order) VALUES
('logistics_route_optimizer',     'logistics', 'Route Optimization AI',       'Dynamic route planning considering real-time traffic, weather, delivery windows, and vehicle capacity for optimal fleet utilization.', 5000, 1200, 40, 1),
('logistics_fleet_manager',       'logistics', 'Fleet Management Agent',      'Predictive vehicle maintenance, driver performance analysis, and fuel consumption optimization across the entire fleet.', 4500, 1000, 30, 2),
('logistics_warehouse_ai',        'logistics', 'Warehouse Intelligence',      'Automated warehouse layout optimization, pick path planning, and inventory placement for maximum throughput.', 4000, 900, 30, 3),
('logistics_demand_forecasting',  'logistics', 'Demand Forecasting AI',       'Multi-horizon demand prediction with seasonality detection, promotional impact analysis, and capacity planning.', 3500, 800, 25, 4),
('logistics_last_mile',           'logistics', 'Last-Mile Delivery Agent',    'Customer communication automation, delivery window optimization, and real-time tracking with predictive ETA updates.', 3000, 700, 20, 5);
