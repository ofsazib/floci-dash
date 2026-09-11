import { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Input,
  Modal,
  SpaceBetween,
  Tabs,
  Textarea,
  Toggle,
} from "@cloudscape-design/components";
import {
  useLandingZones,
  useCreateLandingZone,
  useUpdateLandingZone,
  useResetLandingZone,
  useDeleteLandingZone,
  useLandingZoneOperations,
  useLandingZoneOperation,
  useBaselines,
  useEnabledBaselines,
  useEnabledBaselineDetail,
  useEnableBaseline,
  useUpdateEnabledBaseline,
  useResetEnabledBaseline,
  useBaselineOperation,
} from "../../hooks/useControlTower";
import { useToast } from "../../components/Toast";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

function LandingZoneTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useLandingZones();
  const create = useCreateLandingZone();
  const update = useUpdateLandingZone();
  const reset = useResetLandingZone();
  const remove = useDeleteLandingZone();

  const [showCreate, setShowCreate] = useState(false);
  const [version, setVersion] = useState("");
  const [manifestText, setManifestText] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editVersion, setEditVersion] = useState("");
  const [editManifest, setEditManifest] = useState("");
  const [editRemediation, setEditRemediation] = useState(false);

  const zones: any[] = data?.landingZones || [];
  const canCreate = version.trim().length > 0 && manifestText.trim().length > 0;

  const doCreate = async () => {
    try {
      await create.mutateAsync({ manifest: manifestText, version: version.trim() });
      setShowCreate(false);
      setVersion("");
      setManifestText("");
      showToast("success", "Landing zone created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create landing zone");
    }
  };

  const doUpdate = async () => {
    try {
      await update.mutateAsync({
        landingZoneIdentifier: editing.arn,
        version: editVersion.trim(),
        manifest: editManifest,
        remediationTypes: editRemediation ? ["INHERITANCE_DRIFT"] : undefined,
      });
      setEditing(null);
      showToast("success", "Landing zone update started");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update landing zone");
    }
  };

  const doReset = async (arn: string) => {
    try {
      await reset.mutateAsync(arn);
      showToast("success", "Landing zone reset started");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to reset landing zone");
    }
  };

  const doDelete = async (arn: string) => {
    try {
      await remove.mutateAsync(arn);
      showToast("success", "Landing zone deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete landing zone");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="landing zone"
        loading={isLoading}
        items={zones}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "arn", header: "ARN", cell: (z: any) => z.arn || "—" },
          { id: "version", header: "Version", cell: (z: any) => z.version || "—" },
          {
            id: "latest",
            header: "Latest available",
            cell: (z: any) => z.latestAvailableVersion || "—",
          },
          { id: "status", header: "Status", cell: (z: any) => z.status || "—" },
          { id: "drift", header: "Drift", cell: (z: any) => z.driftStatus || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (z: any) => (
              <SpaceBetween size="xxs" direction="horizontal">
                <Button
                  ariaLabel={`Update ${z.arn}`}
                  onClick={() => {
                    setEditing(z);
                    setEditVersion(z.version || "");
                    setEditManifest(z.manifest ? JSON.stringify(z.manifest, null, 2) : "");
                    setEditRemediation(false);
                  }}
                >
                  Update
                </Button>
                <Button ariaLabel={`Reset ${z.arn}`} onClick={() => doReset(z.arn)}>
                  Reset
                </Button>
                <DeleteButton itemName={z.arn} resourceType="landing zone" onDelete={() => doDelete(z.arn)} />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create landing zone"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!canCreate || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Version" description="Landing zone version, e.g. 4.0">
            <Input value={version} onChange={({ detail }) => setVersion(detail.value)} placeholder="4.0" />
          </FormField>
          <FormField label="Manifest (JSON)">
            <Textarea
              value={manifestText}
              onChange={({ detail }) => setManifestText(detail.value)}
              rows={8}
              placeholder='{ "govern": { "accounts": [] } }'
            />
          </FormField>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={!!editing}
        onDismiss={() => setEditing(null)}
        header="Update landing zone"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={doUpdate} loading={update.isPending}>Save</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Version">
            <Input value={editVersion} onChange={({ detail }) => setEditVersion(detail.value)} />
          </FormField>
          <FormField label="Manifest (JSON)">
            <Textarea
              value={editManifest}
              onChange={({ detail }) => setEditManifest(detail.value)}
              rows={8}
            />
          </FormField>
          <Toggle checked={editRemediation} onChange={({ detail }) => setEditRemediation(detail.checked)}>
            Enable inheritance-drift remediation
          </Toggle>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function BaselinesTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useBaselines();
  const enable = useEnableBaseline();

  const [showEnable, setShowEnable] = useState(false);
  const [baselineIdx, setBaselineIdx] = useState(0);
  const [baselineVersion, setBaselineVersion] = useState("1.0");
  const [targetIdentifier, setTargetIdentifier] = useState("");
  const [parametersText, setParametersText] = useState("");

  const baselines: any[] = data?.baselines || [];
  const selected = baselines.length ? baselines[baselineIdx % baselines.length] : null;
  const canEnable = !!selected && baselineVersion.trim().length > 0 && targetIdentifier.trim().length > 0;

  const doEnable = async () => {
    try {
      await enable.mutateAsync({
        baselineIdentifier: selected.arn,
        baselineVersion: baselineVersion.trim(),
        targetIdentifier: targetIdentifier.trim(),
        parameters: parametersText.trim() ? parametersText : undefined,
      });
      setShowEnable(false);
      setTargetIdentifier("");
      setParametersText("");
      showToast("success", "Baseline enabled");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to enable baseline");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="baseline"
        loading={isLoading}
        items={baselines}
        headerActions={
          <Button onClick={() => setShowEnable(true)} disabled={!baselines.length}>
            Enable baseline
          </Button>
        }
        columns={[
          { id: "name", header: "Name", cell: (b: any) => b.name || "—" },
          { id: "arn", header: "ARN", cell: (b: any) => b.arn || "—" },
          { id: "description", header: "Description", cell: (b: any) => b.description || "—" },
        ]}
      />
      <Modal
        visible={showEnable}
        onDismiss={() => setShowEnable(false)}
        header="Enable baseline"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowEnable(false)}>Cancel</Button>
              <Button variant="primary" onClick={doEnable} disabled={!canEnable || enable.isPending}>Enable</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Baseline">
            <Button onClick={() => setBaselineIdx(baselineIdx + 1)}>
              {selected ? selected.name || selected.arn : "No baselines available"}
            </Button>
          </FormField>
          <FormField label="Baseline version">
            <Input value={baselineVersion} onChange={({ detail }) => setBaselineVersion(detail.value)} />
          </FormField>
          <FormField label="Target ARN" description="Organizational unit or account ARN">
            <Input
              value={targetIdentifier}
              onChange={({ detail }) => setTargetIdentifier(detail.value)}
              placeholder="arn:aws:organizations::123456789012:ou/o-xxx/ou-xxx"
            />
          </FormField>
          <FormField label="Parameters (JSON array, optional)">
            <Textarea
              value={parametersText}
              onChange={({ detail }) => setParametersText(detail.value)}
              rows={4}
              placeholder='[{"key": "IdentityCenterEnabled", "value": true}]'
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function EnabledBaselinesTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useEnabledBaselines();
  const update = useUpdateEnabledBaseline();
  const reset = useResetEnabledBaseline();

  const [editing, setEditing] = useState<any>(null);
  const [version, setVersion] = useState("");
  const [parametersText, setParametersText] = useState("");
  const { data: detail } = useEnabledBaselineDetail(editing?.arn ?? null);

  const rows: any[] = data?.enabledBaselines || [];

  const doUpdate = async () => {
    try {
      await update.mutateAsync({
        enabledBaselineIdentifier: editing.arn,
        baselineVersion: version.trim(),
        parameters: parametersText.trim() ? parametersText : undefined,
      });
      setEditing(null);
      showToast("success", "Enabled baseline updated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update enabled baseline");
    }
  };

  const doReset = async (arn: string) => {
    try {
      await reset.mutateAsync(arn);
      showToast("success", "Enabled baseline reset started");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to reset enabled baseline");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="enabled baseline"
        loading={isLoading}
        items={rows}
        columns={[
          { id: "arn", header: "ARN", cell: (e: any) => e.arn || "—" },
          { id: "baseline", header: "Baseline", cell: (e: any) => e.baselineIdentifier || "—" },
          { id: "version", header: "Version", cell: (e: any) => e.baselineVersion || "—" },
          { id: "target", header: "Target", cell: (e: any) => e.targetIdentifier || "—" },
          { id: "status", header: "Status", cell: (e: any) => e.status || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (e: any) => (
              <SpaceBetween size="xxs" direction="horizontal">
                <Button
                  ariaLabel={`Update ${e.arn}`}
                  onClick={() => {
                    setEditing(e);
                    setVersion(e.baselineVersion || "");
                    setParametersText("");
                  }}
                >
                  Update
                </Button>
                <Button ariaLabel={`Reset ${e.arn}`} onClick={() => doReset(e.arn)}>
                  Reset
                </Button>
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={!!editing}
        onDismiss={() => setEditing(null)}
        header="Update enabled baseline"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={doUpdate} loading={update.isPending}>Save</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Baseline version">
            <Input value={version} onChange={({ detail }) => setVersion(detail.value)} />
          </FormField>
          <FormField label="Parameters (JSON array, optional)">
            <Textarea
              value={parametersText}
              onChange={({ detail }) => setParametersText(detail.value)}
              rows={4}
              placeholder='[{"key": "IdentityCenterEnabled", "value": true}]'
            />
          </FormField>
          {detail?.enabledBaseline?.parameters?.length ? (
            <FormField label="Current parameters">
              <Box>
                <pre>{JSON.stringify(detail.enabledBaseline.parameters, null, 2)}</pre>
              </Box>
            </FormField>
          ) : null}
        </SpaceBetween>
      </Modal>
    </>
  );
}

function OperationsTab() {
  const { data, isLoading } = useLandingZoneOperations();
  const [opDetailId, setOpDetailId] = useState<string | null>(null);
  const { data: opDetail } = useLandingZoneOperation(opDetailId);

  const [lookupId, setLookupId] = useState("");
  const [baselineLookupId, setBaselineLookupId] = useState<string | null>(null);
  const { data: baselineOp } = useBaselineOperation(baselineLookupId);

  const operations: any[] = data?.operations || [];

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="operation"
        loading={isLoading}
        items={operations}
        columns={[
          {
            id: "identifier",
            header: "Operation identifier",
            cell: (o: any) => o.operationIdentifier || "—",
          },
          { id: "type", header: "Type", cell: (o: any) => o.operationType || "—" },
          { id: "status", header: "Status", cell: (o: any) => o.status || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (o: any) => (
              <Button
                ariaLabel={`Details ${o.operationIdentifier}`}
                onClick={() => setOpDetailId(o.operationIdentifier)}
              >
                Details
              </Button>
            ),
          },
        ]}
      />
      <FormField label="Baseline operation lookup" description="Look up any baseline operation identifier">
        <SpaceBetween size="xs" direction="horizontal">
          <Input value={lookupId} onChange={({ detail }) => setLookupId(detail.value)} />
          <Button
            onClick={() => setBaselineLookupId(lookupId.trim())}
            disabled={!lookupId.trim()}
          >
            Lookup
          </Button>
        </SpaceBetween>
      </FormField>
      {baselineOp?.baselineOperation ? (
        <Box>
          <pre>{JSON.stringify(baselineOp.baselineOperation, null, 2)}</pre>
        </Box>
      ) : null}
      <Modal
        visible={!!opDetailId}
        onDismiss={() => setOpDetailId(null)}
        header="Operation details"
        footer={
          <Box float="right">
            <Button variant="link" onClick={() => setOpDetailId(null)}>Close</Button>
          </Box>
        }
      >
        <Box>
          <pre>{opDetail?.operation ? JSON.stringify(opDetail.operation, null, 2) : "Loading…"}</pre>
        </Box>
      </Modal>
    </SpaceBetween>
  );
}

export default function ControlTowerDashboard() {
  return (
    <Tabs
      tabs={[
        { id: "landingzone", label: "Landing zone", content: <LandingZoneTab /> },
        { id: "baselines", label: "Baselines", content: <BaselinesTab /> },
        { id: "enabled", label: "Enabled baselines", content: <EnabledBaselinesTab /> },
        { id: "operations", label: "Operations", content: <OperationsTab /> },
      ]}
    />
  );
}
