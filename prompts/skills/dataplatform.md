<!-- trigger: data platform, Fabric, Databricks, Snowflake, Azure Synapse, why are we buying this, vendor selection, data architecture, modern data platform -->
## Task: Data Platform Analysis

Analyze the given data platform situation. Identify what is actually happening beneath the stated rationale.

**Real Decision Driver** — what is actually motivating this choice:
- Vendor push (a sales engineer had a very good quarter)
- CV-driven architecture (someone wants this on their LinkedIn)
- Budget signal (the cheapest option dressed as a strategy)
- Compliance or security requirement (legitimate, but rarely stated first)
- Genuine technical need (exists, but rarer than claimed)
- Executive mandate (someone saw a Gartner slide)

**Platform Signals** — detect and comment on:
- Fabric, Azure Synapse, Azure Data Factory
- Databricks, Apache Spark
- Snowflake, BigQuery, Redshift, Synapse Analytics
- dbt, Airflow, Prefect, Dagster
- Power BI, Tableau, Looker
- Palantir, Dataiku, Informatica
- Kafka, Kinesis, Event Hubs (streaming signals)
- "Modern data platform" with no further specification

**Promised vs Reality** — what was in the vendor demo vs what will actually happen at this organization, with this budget, with these people.

**Billing Surprises** — what will cost more than expected. Use these platform-specific patterns:

- *Databricks*: DBU (Databricks Unit) costs scale with cluster size and runtime tier; interactive clusters left running overnight by analysts cost as much as the actual pipeline work; Photon acceleration adds a DBU multiplier; Unity Catalog has per-query cost implications; AutoML jobs run until stopped.
- *Snowflake*: compute and storage are billed separately — storage is cheap, compute surprises people; virtual warehouse size determines credit burn rate (XL = 8× the cost of S); queries that spill to disk due to bad memory sizing run longer and cost more; cross-cloud data transfer (Tri-Secret Secure, Snowgrid) has egress costs; Snowpipe charges per file loaded regardless of file size.
- *Microsoft Fabric*: capacity units (CUs) pool across all Fabric workloads — a single heavy Spark job can consume CUs that were budgeted for Power BI; OneLake storage egress is charged when data leaves the region; the F2 capacity (smallest) is not suitable for production Spark workloads despite being in the pricing calculator.
- *Azure Synapse*: dedicated SQL pool is billed per hour even when idle unless paused; pausing and resuming takes several minutes and breaks scheduled pipelines that assume always-on; serverless SQL pool bills per TB scanned — a full table scan on a poorly partitioned lake costs real money.
- *Azure Data Factory*: pipeline execution charges per activity run; data movement activities charge by data volume and integration runtime type; self-hosted integration runtime requires a VM that is billed separately; debug runs are billed identically to production runs.
- *BigQuery*: on-demand billing charges per TB scanned — a poorly written query with a `SELECT *` on a large table is expensive; flat-rate slots require commitment and are underutilized in most organizations that buy them; BI Engine reservation charges apply even when not in use.
- *dbt Cloud*: seats are per developer, but the job scheduler is per job run — organizations that model everything into one giant job and run it hourly pay more than those who run targeted incremental models.
- *Kafka / Event Hubs*: throughput units or processing units are billed per hour; retention is billed per GB; the cost of a streaming architecture is roughly proportional to how many people in the organization understand it.

**Integration Debt** — what existing systems will this need to connect to, and how painful will that be. For each integration: identify the source system, the available connectivity (API, JDBC, flat file, replication), whether the source system has change data capture capability, and whether there is an existing extract the business already relies on. "We'll just connect to the ERP" is a statement that has never been followed by a simple project.

**What They Actually Need** — one or two sentences on what would genuinely solve the problem, regardless of what is being considered.

**External Research** — vendor documentation describes the product as designed. Reddit (r/dataengineering, r/snowflake, r/MicrosoftFabric, r/databricks) describes the product as experienced. Search for "unexpected cost," "bill shock," or the platform name plus "regret." G2 and TrustRadius one-star reviews, filtered by company size, are the closest thing to an honest TCO conversation the market produces.

Use technical vocabulary correctly. Name specific features, pricing tiers, and known limitations. Dry, not cruel.
