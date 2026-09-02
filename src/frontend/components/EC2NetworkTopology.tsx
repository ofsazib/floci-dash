import { useMemo } from "react";
import {
  Box,
  SpaceBetween,
  StatusIndicator,
  Spinner,
  Container,
  Header,
  Icon,
} from "@cloudscape-design/components";
import { useEC2Vpcs } from "../hooks/useEC2";
import { useEC2Subnets } from "../hooks/useEC2";
import { useEC2Instances } from "../hooks/useEC2";
import { useEC2InternetGateways } from "../hooks/useEC2";
import { useEC2RouteTables } from "../hooks/useEC2";

/**
 * Visual network topology diagram showing the relationship between
 * VPCs → Subnets → Instances, plus attached Internet Gateways.
 */
export default function EC2NetworkTopology() {
  const { data: vpcsData, isLoading: vpcsLoading, isError: vpcsError } = useEC2Vpcs();
  const { data: subnetsData, isLoading: subnetsLoading, isError: subnetsError } = useEC2Subnets();
  const { data: instancesData, isLoading: instancesLoading, isError: instancesError } = useEC2Instances();
  const { data: igwsData } = useEC2InternetGateways();
  const { data: rtData } = useEC2RouteTables();

  const isLoading = vpcsLoading || subnetsLoading || instancesLoading;
  const isError = vpcsError || subnetsError || instancesError;

  const topology = useMemo(() => {
    const vpcs = vpcsData?.vpcs || [];
    const subnets = subnetsData?.subnets || [];
    const instances = instancesData?.instances || [];
    const igws = igwsData?.internetGateways || [];
    const rtbs = rtData?.routeTables || [];

    return vpcs.map((vpc) => {
      const vpcSubnets = subnets.filter((s) => s.vpcId === vpc.id);
      const vpcIgws = igws.filter((igw) =>
        igw.attachments?.some((a) => a.vpcId === vpc.id),
      );
      const vpcRtbs = rtbs.filter((rt) => rt.vpcId === vpc.id);

      return {
        vpc,
        subnets: vpcSubnets.map((subnet) => ({
          subnet,
          instances: instances.filter(
            (i) => i.subnetId === subnet.id && i.state !== "terminated",
          ),
        })),
        internetGateways: vpcIgws,
        routeTables: vpcRtbs,
      };
    });
  }, [vpcsData, subnetsData, instancesData, igwsData, rtData]);

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxxl">
        <Spinner /> Loading network topology...
      </Box>
    );
  }

  if (isError) {
    return (
      <StatusIndicator type="error">
        Failed to load network topology data
      </StatusIndicator>
    );
  }

  if (topology.length === 0) {
    return (
      <Box textAlign="center" padding="xxxl" color="text-body-secondary">
        <Icon name="globe" size="big" />
        <Box variant="p" padding={{ top: "s" }}>
          No VPCs found. Create a VPC to see the network topology.
        </Box>
      </Box>
    );
  }

  return (
    <SpaceBetween size="l">
      {/* Legend */}
      <Container header={<Header variant="h3">Network Topology</Header>}>
        <Box variant="p" color="text-body-secondary">
          Visual diagram of your VPC network layout showing the hierarchy of
          VPCs, subnets, instances, and attached resources.
        </Box>
      </Container>

      {/* VPC Cards */}
      <SpaceBetween size="m">
        {topology.map((item) => (
          <VpcCard
            key={item.vpc.id}
            vpc={item.vpc}
            subnets={item.subnets}
            internetGateways={item.internetGateways}
            routeTables={item.routeTables}
          />
        ))}
      </SpaceBetween>
    </SpaceBetween>
  );
}

// ─── Sub-components ────────────────────────────────────

interface SubnetGroup {
  subnet: {
    id: string;
    vpcId?: string;
    cidrBlock?: string;
    availabilityZone?: string;
    state?: string;
    availableIpCount?: number;
  };
  instances: Array<{
    id: string;
    state?: string;
    instanceType?: string;
    privateIp?: string;
    publicIp?: string;
  }>;
}

function VpcCard({
  vpc,
  subnets,
  internetGateways,
  routeTables,
}: {
  vpc: {
    id: string;
    cidrBlock?: string;
    isDefault?: boolean;
    state?: string;
    instanceTenancy?: string;
  };
  subnets: SubnetGroup[];
  internetGateways: Array<{
    id: string;
    attachments?: Array<{ vpcId: string; state: string }>;
  }>;
  routeTables: Array<{
    id: string;
    associations?: Array<{ subnetId?: string; main?: boolean }>;
  }>;
}) {
  return (
    <div
      style={{
        border: "2px solid var(--color-border-container-top, #0972d3)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* VPC Header */}
      <div
        style={{
          background: "var(--color-background-container-header, #f2f3f3)",
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border-divider-default, #eaeded)",
        }}
      >
        <Box variant="awsui-gen-ai-label" fontSize="heading-s" fontWeight="bold">
          <Icon name="globe" /> {vpc.id}
        </Box>
        <Box color="text-body-secondary" fontSize="body-s" padding={{ top: "xxs" }}>
          {vpc.cidrBlock || "No CIDR"} &middot;{" "}
          {vpc.isDefault ? (
            <StatusIndicator type="info">Default VPC</StatusIndicator>
          ) : (
            `Tenancy: ${vpc.instanceTenancy || "default"}`
          )}
        </Box>
      </div>

      {/* VPC Body */}
      <div
        style={{
          padding: "16px",
          background: "var(--color-background-container-content, #fff)",
        }}
      >
        <SpaceBetween size="m">
          {/* Subnets */}
          {subnets.length === 0 ? (
            <Box color="text-body-secondary" fontSize="body-s" padding={{ left: "l" }}>                  <Icon name="status-pending" /> No subnets in this VPC
            </Box>
          ) : (
            subnets.map((sg) => (
              <SubnetCard key={sg.subnet.id} subnetGroup={sg} />
            ))
          )}

          {/* Internet Gateways */}
          {internetGateways.length > 0 && (
            <div
              style={{
                marginTop: "8px",
                paddingTop: "12px",
                borderTop: "1px dashed var(--color-border-divider-default, #eaeded)",
              }}
            >
              <Box fontSize="body-s" fontWeight="bold" color="text-label" padding={{ bottom: "xxs" }}>
                <Icon name="redo" /> Internet Gateways
              </Box>
              <SpaceBetween size="xs" direction="horizontal">
                {internetGateways.map((igw) => (
                  <div
                    key={igw.id}
                    className="fd-accent-card"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                    }}
                  >
                    <span className="fd-dot-success" style={{ width: 6, height: 6 }} />
                    {igw.id}
                  </div>
                ))}
              </SpaceBetween>
            </div>
          )}

          {/* Route Tables */}
          {routeTables.length > 0 && (
            <div
              style={{
                marginTop: "4px",
                paddingTop: "8px",
                borderTop: "1px dashed var(--color-border-divider-default, #eaeded)",
              }}
            >
              <Box fontSize="body-s" fontWeight="bold" color="text-label" padding={{ bottom: "xxs" }}>
                <Icon name="folder-open" /> Route Tables ({routeTables.length})
              </Box>
              <SpaceBetween size="xs" direction="horizontal">
                {routeTables.slice(0, 3).map((rt) => (
                  <span
                    key={rt.id}
                    className="fd-tag-chip"
                    style={{ fontSize: "11px" }}
                  >
                    {rt.id}
                    {rt.associations?.some((a) => a.main) ? " (main)" : ""}
                  </span>
                ))}
                {routeTables.length > 3 && (
                  <span style={{ fontSize: "11px", color: "var(--color-text-body-secondary)" }}>
                    +{routeTables.length - 3} more
                  </span>
                )}
              </SpaceBetween>
            </div>
          )}
        </SpaceBetween>
      </div>
    </div>
  );
}

function SubnetCard({ subnetGroup }: { subnetGroup: SubnetGroup }) {
  const { subnet, instances } = subnetGroup;
  const runningCount = instances.filter((i) => i.state === "running").length;
  const stoppedCount = instances.filter((i) => i.state === "stopped").length;

  return (
    <div
      style={{
        marginLeft: "12px",
        borderLeft: "3px solid var(--color-border-divider-default, #eaeded)",
        paddingLeft: "12px",
      }}
    >
      {/* Subnet Header */}
      <Box fontSize="body-s" fontWeight="bold" padding={{ bottom: "xxs" }}>
        {subnet.id}
      </Box>
      <Box color="text-body-secondary" fontSize="body-s" padding={{ bottom: "xs" }}>
        {subnet.cidrBlock || "No CIDR"}
        {subnet.availabilityZone ? ` \u00b7 ${subnet.availabilityZone}` : ""}
        {subnet.availableIpCount !== undefined
          ? ` \u00b7 ${subnet.availableIpCount} available IPs`
          : ""}
      </Box>

      {/* Instances */}
      {instances.length === 0 ? (
        <Box
          color="text-status-inactive"
          fontSize="body-s"
          padding={{ left: "s", bottom: "xs" }}
        >
          <Icon name="status-pending" /> No running instances
        </Box>
      ) : (
        <SpaceBetween size="xxs">
          {runningCount > 0 && (
            <Box fontSize="body-s" color="text-label" padding={{ bottom: "xxs" }}>
              <Icon name="status-positive" /> Running ({runningCount})
            </Box>
          )}
          {stoppedCount > 0 && (
            <Box fontSize="body-s" color="text-label" padding={{ bottom: "xxs" }}>
              <Icon name="status-warning" /> Stopped ({stoppedCount})
            </Box>
          )}
          {instances.map((instance) => (
            <InstanceRow key={instance.id} instance={instance} />
          ))}
        </SpaceBetween>
      )}
    </div>
  );
}

function InstanceRow({
  instance,
}: {
  instance: {
    id: string;
    state?: string;
    instanceType?: string;
    privateIp?: string;
    publicIp?: string;
  };
}) {
  const stateColor =
    instance.state === "running"
      ? "success"
      : instance.state === "stopped"
        ? "warning"
        : "in-progress";

  return (
    <div
      className="fd-accent-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 10px",
        fontSize: "12px",
        marginLeft: "8px",
      }}
    >
      <StatusIndicator type={stateColor}>
        {instance.state || "unknown"}
      </StatusIndicator>
      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
        {instance.id}
      </span>
      <span style={{ color: "var(--color-text-body-secondary, #545b64)" }}>
        {instance.instanceType || "-"}
      </span>
      <span style={{ color: "var(--color-text-body-secondary, #545b64)" }}>
        {instance.privateIp || "-"}
      </span>
      {instance.publicIp && (
        <span style={{ color: "var(--color-text-body-secondary, #545b64)" }}>
          {instance.publicIp}
        </span>
      )}
    </div>
  );
}
