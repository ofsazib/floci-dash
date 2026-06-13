import { Box, SpaceBetween } from "@cloudscape-design/components";
import { SERVICE_LABELS } from "../types/services";
import ServiceCard from "./ServiceCard";

const CATEGORY_ORDER = [
  "Compute", "Storage", "Database", "Networking", "Messaging",
  "Security", "Management", "Analytics", "ML/AI", "Billing",
  "Developer Tools", "Migration",
];

const SERVICE_CATEGORY_MAP: Record<string, string> = {
  ec2: "Compute", lambda: "Compute", ecs: "Compute", eks: "Compute", autoscaling: "Compute",
  s3: "Storage", ecr: "Storage",
  dynamodb: "Database", rds: "Database", neptune: "Database", elasticache: "Database",
  elasticloadbalancing: "Networking", route53: "Networking", cloudfront: "Networking",
  apigateway: "Networking", apigatewayv2: "Networking", appsync: "Networking",
  sqs: "Messaging", sns: "Messaging", events: "Messaging", kinesis: "Messaging",
  pipes: "Messaging", scheduler: "Messaging", email: "Messaging",
  iam: "Security", sts: "Security", "cognito-idp": "Security", kms: "Security",
  secretsmanager: "Security", acm: "Security",
  cloudformation: "Management", monitoring: "Management", logs: "Management", ssm: "Management",
  config: "Management", appconfig: "Management", appconfigdata: "Management",
  cloudtrail: "Management", servicediscovery: "Management",
  athena: "Analytics", glue: "Analytics", firehose: "Analytics", states: "Analytics",
  kafka: "Analytics", es: "Analytics",
  "bedrock-runtime": "ML/AI", textract: "ML/AI", transcribe: "ML/AI",
  ce: "Billing", cur: "Billing", "bcm-data-exports": "Billing", pricing: "Billing", tagging: "Billing",
  codedeploy: "Developer Tools", codebuild: "Developer Tools",
  backup: "Migration", transfer: "Migration",
};

interface Props {
  services: Record<string, "running" | "available">;
}

export default function ServiceGrid({ services }: Props) {
  const grouped: Record<string, string[]> = {};
  for (const key of Object.keys(services)) {
    const cat = SERVICE_CATEGORY_MAP[key] || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(key);
  }

  const orderedCategories = CATEGORY_ORDER.filter((c) => grouped[c]?.length);
  if (grouped["Other"]?.length) orderedCategories.push("Other");

  return (
    <SpaceBetween size="l">
      {orderedCategories.map((category) => {
        const keys = grouped[category].sort((a, b) =>
          (SERVICE_LABELS[a] || a).localeCompare(SERVICE_LABELS[b] || b)
        );
        return (
          <div key={category}>
            <Box variant="h3" padding={{ bottom: "m" }} color="text-body-secondary">
              {category}
            </Box>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              {keys.map((key) => (
                <ServiceCard key={key} serviceKey={key} status={services[key]} />
              ))}
            </div>
          </div>
        );
      })}
    </SpaceBetween>
  );
}
