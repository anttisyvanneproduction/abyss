export type DataPlatformSignal =
  | "fabric"
  | "databricks"
  | "snowflake"
  | "synapse"
  | "bigquery"
  | "redshift"
  | "dbt"
  | "powerbi"
  | "adf"
  | "streaming"
  | "airflow"
  | "palantir";

export interface DataPlatformFinding {
  platform: DataPlatformSignal;
  name: string;
  decisionDriver: string;
  whatTheyPromised: string;
  whatWillHappen: string;
  technicalNotes: string[];
  billingSurprise: string;
  confidence: "low" | "medium" | "high";
  evidence: string[];
}

export interface DataPlatformAnalysis {
  findings: DataPlatformFinding[];
  verdict: string;
  destination: string;
}

const rules: Array<{
  platform: DataPlatformSignal;
  name: string;
  patterns: RegExp[];
  decisionDriver: string;
  whatTheyPromised: string;
  whatWillHappen: string;
  technicalNotes: string[];
  billingSurprise: string;
  confidence: "low" | "medium" | "high";
}> = [
  {
    platform: "fabric",
    name: "Fabric",
    patterns: [
      /\bfabric\b/i,
      /\bonelake\b/i,
      /\bf\d+\s*(sku|capacity)\b/i,
      /\bfabric\s+(capacity|lakehouse|warehouse|notebook|eventhouse|real.?time)\b/i
    ],
    decisionDriver:
      "Your CIO was shown a slide that said 'unified analytics platform' and 'included in M365'. The slide was accurate. The implementation timeline was not.",
    whatTheyPromised:
      "One platform for everything. Analytics, data engineering, data science, and business intelligence in a single product. Included in your existing enterprise licensing.",
    whatWillHappen:
      "You will spend six months on capacity management, two months understanding why DirectLake mode has specific prerequisites, and one meeting explaining to the CIO that 'included' means licensed separately above a certain data volume.",
    technicalNotes: [
      "OneLake is the storage layer — Delta/Parquet underneath; all Fabric items read from the same lake",
      "Capacity is billed in CUs (Compute Units) — size your F-SKU before enabling large workloads",
      "DirectLake mode queries Delta tables directly without import — fast, but requires well-optimized Delta files",
      "Pipelines are Azure Data Factory, rebadged inside the workspace",
      "Real-time intelligence uses Eventhouse (KQL Database) — a different query language from SQL"
    ],
    billingSurprise:
      "The tenant-level capacity billing model means a single poorly-optimized report can consume your entire F-SKU allocation during month-end reporting. Pause what you do not need.",
    confidence: "high"
  },
  {
    platform: "databricks",
    name: "Databricks",
    patterns: [
      /\bdatabricks\b/i,
      /\bdelta\s+lake\b/i,
      /\bdelta\s+live\s+tables?\b/i,
      /\bmlflow\b/i,
      /\bunity\s+catalog\b/i,
      /\bphoton\s+(engine|runtime)?\b/i,
      /\bdbu\b/i
    ],
    decisionDriver:
      "Your data engineers found Databricks at a conference and have been arguing for it since. They are right. It is also expensive and requires people who understand distributed compute.",
    whatTheyPromised:
      "The lakehouse paradigm. Delta tables with ACID transactions. Unity Catalog for governance and lineage. MLflow for experiment tracking. Photon for faster SQL. Everything your data engineers wanted.",
    whatWillHappen:
      "You will spend money on cluster configuration, Delta table optimization jobs, and explaining to Business what a Spark cluster is. The data engineers will be happy. Engineer happiness is rare and should be budgeted for.",
    technicalNotes: [
      "Delta tables are the storage format — ACID transactions, time travel, schema evolution included",
      "Unity Catalog is the governance layer — grants, lineage, tags, row/column-level security",
      "Photon is an optimized query engine — faster for SQL-heavy workloads; billed at a higher DBU rate",
      "Compute is billed per DBU — cluster size vs workload requirements is the primary cost lever",
      "Delta Live Tables (DLT) is a managed pipeline framework — declarative, quality-enforced, auto-scaled"
    ],
    billingSurprise:
      "Clusters left running overnight cost the same as clusters doing work. The 'idle cluster' is the standard Databricks billing experience. Enable auto-termination. This advice is given at every implementation kickoff and ignored in at least one cluster.",
    confidence: "high"
  },
  {
    platform: "snowflake",
    name: "Snowflake",
    patterns: [
      /\bsnowflake\b/i,
      /\bvirtual\s+warehouse\b/i,
      /\bsnowpipe\b/i,
      /\bzero.copy\s+clon/i,
      /\bsnowflake\s+(credit|storage|account)\b/i
    ],
    decisionDriver:
      "A cloud-native database that separates storage and compute. The per-credit model seemed predictable until month-end reporting ran 14 concurrent queries for 6 hours simultaneously.",
    whatTheyPromised:
      "Separation of storage and compute. Automatic scaling. Data sharing across organizations without copying data. Time travel up to 90 days. Zero-copy cloning for safe test environments.",
    whatWillHappen:
      "You will pay for Snowflake for a very long time. This is not a criticism. The query performance is excellent. The bill is also excellent, and will require a governance process before the end of Q1.",
    technicalNotes: [
      "Virtual warehouses are independent compute clusters — multiple can run simultaneously; each bills separately",
      "Storage is cheap; compute credits are where cost lives — right-size warehouses to workloads",
      "Time travel default is 1 day (Standard edition), up to 90 days (Enterprise) — Fail-safe adds 7 read-only days beyond that",
      "Zero-copy cloning creates a logical pointer to existing data — modifying a clone creates new micro-partitions only for changed data",
      "Snowpipe is continuous ingest from cloud storage — files land in S3/ADLS/GCS, Snowpipe loads them automatically"
    ],
    billingSurprise:
      "Query result caching prevents re-computation for identical queries, but only within 24 hours and only if nothing changed. The first billing review will produce a governance process. The governance process will reference this surprise.",
    confidence: "high"
  },
  {
    platform: "synapse",
    name: "Azure Synapse Analytics",
    patterns: [
      /\bsynapse\b/i,
      /\bazure\s+synapse\b/i,
      /\bdedicated\s+sql\s+pool\b/i,
      /\bserverless\s+sql\s+pool\b/i,
      /\bsynapse\s+analytics\b/i,
      /\bsynapse\s+workspace\b/i
    ],
    decisionDriver:
      "Synapse was the platform vendor's answer to Databricks, announced in 2019. In 2023 the vendor announced Fabric as the strategic direction. Synapse is still available, fully supported, and actively used. This is the enterprise condition.",
    whatTheyPromised:
      "Unified analytics in one workspace. Dedicated SQL Pool for enterprise data warehousing. Serverless SQL Pool for on-demand data lake queries. Spark for data engineering. Integration pipelines included.",
    whatWillHappen:
      "The project will be delivered on Synapse. The platform will be maintained. Your successors will attend a Fabric readiness workshop. The migration memo will be written, reviewed, and filed. The timeline will be TBD.",
    technicalNotes: [
      "Dedicated SQL Pool = provisioned MPP data warehouse — billed per hour when running; pause when not in use",
      "Serverless SQL Pool = pay-per-TB-scanned over ADLS — no provisioning; billing is separate from Dedicated Pool",
      "Spark pools in Synapse are similar to Databricks but with less ecosystem maturity",
      "Synapse Pipelines = Azure Data Factory, embedded in the workspace — same JSON format, different portal",
      "The vendor's stated direction is Fabric; Synapse receives security and support updates, not new innovation"
    ],
    billingSurprise:
      "Dedicated SQL Pool charges by the hour regardless of query activity. Pause it when not in use. This is the most frequently given and least frequently acted-upon piece of Synapse advice.",
    confidence: "high"
  },
  {
    platform: "bigquery",
    name: "BigQuery",
    patterns: [
      /\bbigquery\b/i,
      /\bgcp\b/i,
      /\bgoogle\s+cloud\b/i,
      /\bbqml\b/i,
      /\bbigquery\s+ml\b/i,
      /\blooker\b/i
    ],
    decisionDriver:
      "You are already in Google Cloud, or someone showed you the BigQuery pricing calculator and it looked reasonable compared to the alternatives. Both are valid reasons.",
    whatTheyPromised:
      "Serverless SQL at scale. No infrastructure management. Pay per query. The fastest execution on large analytical datasets. BQML for SQL-based machine learning. Looker for governed BI.",
    whatWillHappen:
      "A developer will run a query without a WHERE clause against a large unpartitioned table during development. This is a rite of passage. After that, the team will understand partition pruning, clustering, and slot reservations.",
    technicalNotes: [
      "On-demand billing = per TB scanned — partition tables and always use partition filters in WHERE clauses",
      "Reservation/flat-rate billing = reserved slots — better for predictable, concurrent workloads",
      "Datasets are regional — plan data residency before creating resources; cross-region query costs extra",
      "BQML allows SQL-based model training and inference — convenient for SQL-native teams; limited vs dedicated ML platforms",
      "Looker (acquired 2019) adds a semantic modeling layer; it has separate licensing from BigQuery"
    ],
    billingSurprise:
      "Scanning the same data 100 times costs 100x on on-demand pricing. Query result cache helps but expires after 24 hours and does not apply if table data changed. Build materialized views early if the same queries run repeatedly.",
    confidence: "high"
  },
  {
    platform: "redshift",
    name: "Amazon Redshift",
    patterns: [
      /\bredshift\b/i,
      /\bamazon\s+redshift\b/i,
      /\bredshift\s+spectrum\b/i,
      /\bra3\b/i,
      /\bredshift\s+serverless\b/i
    ],
    decisionDriver:
      "You are in AWS and the data team was not given a choice of cloud provider. This is infrastructure gravity, not data platform selection. The decision was made when the cloud vendor was chosen.",
    whatTheyPromised:
      "A managed MPP database. Redshift Spectrum for querying S3 directly without loading data. RA3 nodes to separate storage and compute. Native integration with the AWS data ecosystem.",
    whatWillHappen:
      "Redshift will work correctly. The complexity will come from distribution key and sort key decisions, VACUUM and ANALYZE maintenance, and explaining columnar storage behavior to people expecting row-based databases. Then Redshift Serverless becomes available and the sizing conversation starts over.",
    technicalNotes: [
      "Sort keys and distribution keys affect query performance significantly — plan before first data load, not after",
      "VACUUM reclaims space and re-sorts data; ANALYZE updates statistics — automate both from the start",
      "Spectrum queries Parquet/ORC/CSV in S3 without loading into Redshift — billed per TB scanned",
      "RA3 nodes separate compute from managed storage (RMS, backed by S3) — scale compute and storage independently",
      "Redshift Serverless = pay-per-RPU-second — good for intermittent workloads; Provisioned = per-hour for steady workloads"
    ],
    billingSurprise:
      "Provisioned clusters bill per hour whether or not queries are running. Pause during non-business hours if your workload allows it. Redshift Serverless eliminates idle billing but can cost more under sustained concurrent load.",
    confidence: "high"
  },
  {
    platform: "dbt",
    name: "dbt",
    patterns: [
      /\bdbt\b/i,
      /\bdata\s+build\s+tool\b/i,
      /\bdbt\s+cloud\b/i,
      /\bdbt\s+core\b/i,
      /\bdbt\s+(model|source|seed|test|run|compile)\b/i
    ],
    decisionDriver:
      "Your data engineers discovered software engineering practices and want to apply them to SQL. Version control for transformations. Tests on columns. Auto-generated lineage documentation. They are correct.",
    whatTheyPromised:
      "The transformation layer. SQL with modularity and dependency management. Tests built into the models. Lineage documented automatically from ref() calls. Deploy the same way you deploy application code.",
    whatWillHappen:
      "dbt will become the center of your data team's workflow. It is not a data platform. It will feel like one. Your models will proliferate. You will eventually need governance over dbt models, which is a sentence that perfectly captures the data engineering condition.",
    technicalNotes: [
      "dbt runs SQL transformations against a target warehouse — it needs a warehouse (Snowflake, BigQuery, Databricks, Redshift, etc.)",
      "ref() creates inter-model dependencies and generates lineage automatically — use it everywhere",
      "Built-in tests: not_null, unique, accepted_values, relationships — custom tests via SQL or Python",
      "dbt Core is open source; dbt Cloud adds scheduling, CI/CD pipelines, documentation hosting, and governance features",
      "Alternatives: SQLMesh (state-aware, dbt-compatible), Coalesce, Datafold — each has different opinions on state management"
    ],
    billingSurprise:
      "dbt Core is free. Running it reliably requires a scheduler. dbt Cloud provides one at per-developer pricing. The surprising part is not the cost — it is that you eventually need the Cloud version.",
    confidence: "high"
  },
  {
    platform: "powerbi",
    name: "Power BI",
    patterns: [
      /\bpower\s*bi\b/i,
      /\bpbix\b/i,
      /\bpbit\b/i,
      /\bsemantic\s+model\b/i,
      /\bdax\b/i,
      /\bpower\s*bi\s+premium\b/i,
      /\bpbi\b/i
    ],
    decisionDriver:
      "Power BI is where all data journeys end, regardless of the architecture chosen for the beginning. It is not a data platform decision. It is a destination.",
    whatTheyPromised:
      "Self-service analytics. Drag-and-drop reports. Shared semantic models for consistency. Direct integration with first-party data sources. AI-powered insights. Mobile access.",
    whatWillHappen:
      "You will have two definitions of revenue in one workspace. They will be calculated differently because two people had separate conversations with Business at different times. A steering group will form. The steering group will acknowledge the issue. Both measures will remain in the report, on separate pages, with a footnote.",
    technicalNotes: [
      "The semantic model (formerly dataset) is the shared calculation layer — get this right and everything is consistent; get it wrong and everything branches",
      "Import mode stores data in Power BI — fast queries, but with refresh delay and model size limits",
      "DirectQuery is live against the source — no refresh delay, but slower queries and more source load",
      "Power BI Premium per capacity = one billing unit for unlimited users; per user Premium = $20/user/month for larger models and more frequent refresh",
      "DAX is the measure and calculated column language — it is not SQL; this consistently surprises people who expect it to be SQL",
      "Row-level security (RLS) is powerful and frequently implemented incorrectly on the first attempt"
    ],
    billingSurprise:
      "Premium per-capacity billing covers unlimited users. The side effect is that unlimited users can build unlimited reports with no oversight, which eventually requires a capacity increase and a governance discussion that could have happened earlier.",
    confidence: "high"
  },
  {
    platform: "adf",
    name: "Azure Data Factory",
    patterns: [
      /\badf\b/i,
      /\bazure\s+data\s+factory\b/i,
      /\bdata\s+factory\b/i,
      /\bintegration\s+runtime\b/i,
      /\blinked\s+service\b/i,
      /\bmapping\s+data\s+flow\b/i
    ],
    decisionDriver:
      "ADF started as an ETL orchestration tool. It became an integration platform. It is now a governance concern with a monitoring dashboard and 200 pipelines named in three different conventions.",
    whatTheyPromised:
      "Code-free data integration. Hundreds of connectors. Visual pipeline design. Managed integration runtime for on-premise connectivity. Built-in monitoring and alerting.",
    whatWillHappen:
      "You will have 200 pipelines. Their names will not follow the naming convention established in week two. The naming convention document lives in SharePoint. The folder path is known only to the person who created it and the person who inherited the project.",
    technicalNotes: [
      "ADF pipelines are JSON under the hood — enable Git integration from the start; do not skip this",
      "Integration Runtime: Azure IR for cloud-to-cloud; Self-Hosted IR for on-premise or private network sources",
      "Triggers: scheduled, tumbling window, event-based — each has different retry and dependency semantics",
      "Mapping Data Flows = Spark-based visual transformations — billed separately from pipeline orchestration activities",
      "Synapse Pipelines and Fabric Pipelines are ADF, rebadged in their respective workspaces — same JSON format, different portal"
    ],
    billingSurprise:
      "Pipeline orchestration billing is per activity run, not per pipeline run. A pipeline with 40 activities that runs every hour generates 960 activity runs per day. The pricing calculator does not always surface this clearly until the first invoice.",
    confidence: "high"
  },
  {
    platform: "streaming",
    name: "Streaming / Event-Driven",
    patterns: [
      /\bkafka\b/i,
      /\bevent\s+hub\b/i,
      /\bconfluen\w+\b/i,
      /\bstream\s+processing\b/i,
      /\bflink\b/i,
      /\bkinesis\b/i,
      /\bevent.driven\s+architect/i,
      /\breal.time\s+(data|pipeline|ingest)/i
    ],
    decisionDriver:
      "Someone said 'real-time' in a requirements meeting. Now there is a streaming platform. The source system still does nightly batch exports.",
    whatTheyPromised:
      "Real-time data. Event-driven architecture. Millisecond latency. Stream processing at scale. No more batch windows. The ability to respond to events as they happen.",
    whatWillHappen:
      "You will discover that 'real-time' means within 15 minutes to Business and within 50 milliseconds to the engineers. The 15-minute requirement does not justify a streaming platform. The engineers will argue that it will eventually need to be milliseconds. They may be correct. That day may be five years away.",
    technicalNotes: [
      "Kafka is a distributed, durable, ordered log — not a query engine; processing or a consumer application is required separately",
      "Confluent adds managed Kafka + Schema Registry + 200+ connectors — significantly easier to operate; significantly more expensive",
      "Event Hub (Azure) is Kafka-compatible — use the Kafka API to avoid lock-in at the application level",
      "Kinesis (AWS) uses a different API from Kafka — same conceptual model, different operational and cost characteristics",
      "Stream processing (Flink, Spark Streaming, Kafka Streams) is a separate skill set from batch ETL — plan the team accordingly"
    ],
    billingSurprise:
      "Kafka is open source. Running Kafka at production scale is a full-time engineering effort or a Confluent invoice. Both are more expensive than the batch alternative the requirements actually justify.",
    confidence: "medium"
  },
  {
    platform: "airflow",
    name: "Apache Airflow",
    patterns: [
      /\bairflow\b/i,
      /\bapache\s+airflow\b/i,
      /\b(airflow\s+)?dag\b/i,
      /\bastroner\b/i,
      /\bastronomer\b/i,
      /\bmwaa\b/i,
      /\bcloud\s+composer\b/i
    ],
    decisionDriver:
      "Your data engineers want to manage their own scheduler. This is either excellent engineering discipline or the beginning of a platform team that nobody budgeted for.",
    whatTheyPromised:
      "Python-native workflow orchestration. DAGs as code. 1000+ operators for every data source. The industry standard for data pipeline scheduling. Full control over execution.",
    whatWillHappen:
      "You will have 80 DAGs. Their naming conventions will be discussed in a team meeting. The meeting will produce a document. The document will be in Confluence. Four engineers will have four opinions on DAG structure. The fifth engineer will arrive later and follow none of them.",
    technicalNotes: [
      "Airflow is a scheduler — it triggers tasks; it does not move or transform data on its own",
      "Workers scale independently from the scheduler and web server — capacity is planned separately",
      "Managed options: Cloud Composer (GCP), MWAA (AWS), Astronomer (vendor) — reduce operational overhead at a cost",
      "Astronomer adds CI/CD for DAGs, Astro Runtime environments, and dedicated support — the enterprise Airflow company",
      "Alternatives: Dagster, Prefect, Mage — each has different opinions on asset-based vs task-based orchestration"
    ],
    billingSurprise:
      "Managed Airflow environments are priced per environment (always on) plus worker compute. A lightweight scheduling need costs nearly the same to host as a heavy one. Teams expecting pay-per-use are surprised.",
    confidence: "medium"
  },
  {
    platform: "palantir",
    name: "Palantir Foundry",
    patterns: [
      /\bpalantir\b/i,
      /\bfoundry\b/i,
      /\bgotham\b/i,
      /\b(palantir\s+)?aip\b/i,
      /\bontology\b/i
    ],
    decisionDriver:
      "You have government contracts, defense budget, or a CEO who saw the demo. The data model is genuinely impressive. The licensing conversation will be longer than the implementation.",
    whatTheyPromised:
      "An ontology-driven data platform where business concepts are modeled as objects with relationships. AI agents that reason over operational data. Foundry as the intelligence layer over your enterprise.",
    whatWillHappen:
      "You will spend several months modeling your ontology. This will be the most conceptually interesting data architecture work your team has done. It will also require Palantir-certified delivery capability. Budget the certification alongside the platform.",
    technicalNotes: [
      "Foundry = enterprise data platform with ontology modeling, Transforms (pipelines), and analysis tools (Slate, Quiver, Workshop)",
      "AIP (Artificial Intelligence Platform) adds LLM-based agents that reason over the ontology — genuine capability, not a marketing wrapper",
      "Gotham is the government and intelligence platform — a separate product with separate procurement requirements",
      "Ontology modeling is a conceptual shift from table-based data warehousing — plan for the team learning curve",
      "Available on AWS, Azure, and GCP marketplaces — committed cloud spend can offset platform licensing cost in some structures"
    ],
    billingSurprise:
      "Enterprise licensing. Contact sales. This is not a euphemism. The pricing is negotiated, not listed. The negotiation takes longer than expected. Budget the time as a project cost.",
    confidence: "high"
  }
];

function downgrade(confidence: "low" | "medium" | "high"): "low" | "medium" | "high" {
  if (confidence === "high") return "medium";
  if (confidence === "medium") return "low";
  return "low";
}

export function analyzeDataPlatform(input: string): DataPlatformAnalysis {
  const findings: DataPlatformFinding[] = rules
    .map((rule) => {
      const evidence = rule.patterns
        .map((pattern) => input.match(pattern)?.[0])
        .filter((match): match is string => Boolean(match));

      if (evidence.length === 0) return undefined;

      return {
        platform: rule.platform,
        name: rule.name,
        decisionDriver: rule.decisionDriver,
        whatTheyPromised: rule.whatTheyPromised,
        whatWillHappen: rule.whatWillHappen,
        technicalNotes: rule.technicalNotes,
        billingSurprise: rule.billingSurprise,
        evidence: [...new Set(evidence)],
        confidence: evidence.length > 1 ? rule.confidence : downgrade(rule.confidence)
      } satisfies DataPlatformFinding;
    })
    .filter((item): item is DataPlatformFinding => Boolean(item));

  const verdict = buildVerdict(findings);

  const destination = findings.some((f) => f.platform === "powerbi")
    ? "The destination has been reached. Power BI is both the journey and the conclusion."
    : "The destination is Power BI. Or Excel. Regardless of the architecture chosen above it. This is not a prediction. It is physics.";

  return { findings, verdict, destination };
}

function buildVerdict(findings: DataPlatformFinding[]): string {
  if (findings.length === 0) {
    return "No data platform signals detected. Either the platform has not been chosen yet, or it has been chosen and not mentioned, which is also a data governance signal.";
  }

  const platforms = findings.map((f) => f.platform);

  if (platforms.includes("fabric") && platforms.includes("databricks")) {
    return "You have both Fabric and Databricks. This is either a deliberate polyglot strategy or two independent decisions made in the same quarter by different parts of the organization. The invoice will clarify which.";
  }

  if (platforms.includes("fabric") && !platforms.includes("databricks")) {
    return "The architecture was chosen at or near C-level, likely with input from a platform vendor account team. The implementation team will inherit it. This is a common and workable situation.";
  }

  if (platforms.includes("databricks") && platforms.includes("dbt")) {
    return "Databricks plus dbt is an engineer-led architecture. The engineers are probably right. The question is whether the organization has built the team to match the ambition of the platform.";
  }

  if (platforms.includes("databricks") && !platforms.includes("fabric")) {
    return "The engineers made this choice. They are probably right. The question is whether the organization has built the team to match the ambition, and whether the billing review will be a quarterly or annual conversation.";
  }

  if (platforms.includes("snowflake") && platforms.includes("dbt")) {
    return "Snowflake plus dbt is the current industry consensus for SQL-centric data teams. This is a reasonable choice made by engineers who read the internet. The billing review will be the main recurring governance event.";
  }

  if (platforms.includes("synapse") && !platforms.includes("fabric")) {
    return "Synapse is a complete and viable platform. It is also the platform that pre-dates Fabric. Your successor will attend a migration readiness workshop at some point. This is not urgent. It is merely scheduled.";
  }

  if (platforms.includes("streaming")) {
    return "There is a streaming platform in this architecture. Verify that the latency requirement actually justifies it. If the requirement is under 15 minutes, there is a simpler path.";
  }

  if (platforms.length > 3) {
    return `You have ${platforms.length} platform signals in a single description. This is either sophisticated multi-platform architecture or the accumulation of independent decisions that were never reconciled. Both are real enterprise conditions.`;
  }

  return `Detected: ${findings.map((f) => f.name).join(", ")}. These are recognized patterns. The implementation details determine whether this is architecture or accumulation.`;
}

export function formatDataPlatformAnalysis(analysis: DataPlatformAnalysis): string {
  if (analysis.findings.length === 0) {
    return [
      "Data Platform Oracle",
      "",
      "No specific platform signals detected.",
      "",
      analysis.verdict,
      "",
      analysis.destination
    ].join("\n");
  }

  const sections = analysis.findings.map((f) =>
    [
      `--- ${f.name} --- [${f.confidence} confidence · detected: ${f.evidence.join(", ")}]`,
      "",
      "Why you chose it:",
      `  ${f.decisionDriver}`,
      "",
      "What they promised:",
      `  ${f.whatTheyPromised}`,
      "",
      "What will happen:",
      `  ${f.whatWillHappen}`,
      "",
      "Technical notes:",
      ...f.technicalNotes.map((n) => `  - ${n}`),
      "",
      "Billing:",
      `  ${f.billingSurprise}`
    ].join("\n")
  );

  return [
    "Data Platform Oracle",
    `Detected: ${analysis.findings.map((f) => f.name).join(", ")}`,
    "",
    ...sections.flatMap((s) => [s, ""]),
    "---",
    "",
    `Verdict: ${analysis.verdict}`,
    "",
    `Destination: ${analysis.destination}`
  ].join("\n");
}
