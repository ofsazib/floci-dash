import { useState, useEffect } from "react";
import {
  Box,
  SpaceBetween,
  Button,
  Form,
  FormField,
  Input,
  Textarea,
  Select,
  StatusIndicator,
  Container,
  Header,
  Toggle,
  Alert,
  Spinner,
  Table,
  Modal,
  type ToggleProps,
  type SelectProps,
} from "@cloudscape-design/components";
import {
  useS3BucketVersioning,
  useS3UpdateVersioning,
  useS3BucketTags,
  useS3UpdateBucketTags,
  useS3BucketPolicy,
  useS3UpdateBucketPolicy,
  useS3DeleteBucketPolicy,
  useS3BucketLifecycle,
  useS3UpdateBucketLifecycle,
  useS3DeleteBucketLifecycle,
  useS3BucketCors,
  useS3UpdateBucketCors,
  useS3DeleteBucketCors,
  useS3BucketWebsite,
  useS3UpdateBucketWebsite,
  useS3DeleteBucketWebsite,
  useS3BucketEncryption,
  useS3UpdateBucketEncryption,
  useS3DeleteBucketEncryption,
  useS3BucketNotifications,
  useS3PublicAccessBlock,
  useS3UpdatePublicAccessBlock,
  useS3BucketLogging,
  useS3UpdateBucketLogging,
  type S3Tag,
} from "../hooks/useS3Config";

interface Props {
  bucket: string;
}

const ENCRYPTION_OPTIONS: SelectProps.Option[] = [
  { label: "AES256 (SSE-S3)", value: "AES256" },
  { label: "aws:kms (SSE-KMS)", value: "aws:kms" },
];

const VERSIONING_OPTIONS: SelectProps.Option[] = [
  { label: "Enabled", value: "Enabled" },
  { label: "Suspended", value: "Suspended" },
];

const STORAGE_CLASSES: SelectProps.Option[] = [
  { label: "GLACIER", value: "GLACIER" },
  { label: "DEEP_ARCHIVE", value: "DEEP_ARCHIVE" },
  { label: "STANDARD_IA", value: "STANDARD_IA" },
  { label: "ONEZONE_IA", value: "ONEZONE_IA" },
  { label: "INTELLIGENT_TIERING", value: "INTELLIGENT_TIERING" },
];

export default function S3BucketConfig({ bucket }: Props) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { label: "Overview", id: "overview" },
    { label: "Versioning", id: "versioning" },
    { label: "Tags", id: "tags" },
    { label: "Policy", id: "policy" },
    { label: "Encryption", id: "encryption" },
    { label: "Lifecycle", id: "lifecycle" },
    { label: "CORS", id: "cors" },
    { label: "Website", id: "website" },
    { label: "Notifications", id: "notifications" },
    { label: "Public Access", id: "public-access" },
    { label: "Logging", id: "logging" },
  ];

  return (
    <SpaceBetween size="l">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "primary" : "normal"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && <BucketOverview bucket={bucket} />}
      {activeTab === "versioning" && <BucketVersioning bucket={bucket} />}
      {activeTab === "tags" && <BucketTags bucket={bucket} />}
      {activeTab === "policy" && <BucketPolicy bucket={bucket} />}
      {activeTab === "encryption" && <BucketEncryption bucket={bucket} />}
      {activeTab === "lifecycle" && <BucketLifecycle bucket={bucket} />}
      {activeTab === "cors" && <BucketCors bucket={bucket} />}
      {activeTab === "website" && <BucketWebsite bucket={bucket} />}
      {activeTab === "notifications" && <BucketNotifications bucket={bucket} />}
      {activeTab === "public-access" && <BucketPublicAccess bucket={bucket} />}
      {activeTab === "logging" && <BucketLogging bucket={bucket} />}
    </SpaceBetween>
  );
}

function BucketOverview({ bucket }: Props) {
  const { data: versioning } = useS3BucketVersioning(bucket);
  const { data: encryption } = useS3BucketEncryption(bucket);
  const { data: tags } = useS3BucketTags(bucket);
  const { data: logging } = useS3BucketLogging(bucket);

  return (
    <SpaceBetween size="m">
      <Container header={<Header variant="h3">Bucket Configuration Summary</Header>}>
        <SpaceBetween size="s">
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-divider-default, #e9ebed)" }}>
            <Box variant="strong">Versioning</Box>
            <StatusIndicator type={versioning?.status === "Enabled" ? "success" : "info"}>
              {versioning?.status || "Unknown"}
            </StatusIndicator>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-divider-default, #e9ebed)" }}>
            <Box variant="strong">Default Encryption</Box>
            <StatusIndicator type={encryption?.configured ? "success" : "info"}>
              {encryption?.configured ? "Enabled" : "Not configured"}
            </StatusIndicator>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-divider-default, #e9ebed)" }}>
            <Box variant="strong">Tags</Box>
            <Box>{tags?.total || 0} tag(s)</Box>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-divider-default, #e9ebed)" }}>
            <Box variant="strong">Access Logging</Box>
            <StatusIndicator type={logging?.enabled ? "success" : "info"}>
              {logging?.enabled ? `Enabled → ${logging.targetBucket}` : "Disabled"}
            </StatusIndicator>
          </div>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}

function BucketVersioning({ bucket }: Props) {
  const { data, isLoading } = useS3BucketVersioning(bucket);
  const updateVersioning = useS3UpdateVersioning(bucket);
  const [selected, setSelected] = useState<SelectProps.Option>(VERSIONING_OPTIONS[0]);

  useEffect(() => {
    if (data?.status) {
      setSelected(VERSIONING_OPTIONS.find((o) => o.value === data.status) || VERSIONING_OPTIONS[0]);
    }
  }, [data?.status]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Bucket Versioning</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Versioning enables you to keep multiple variants of an object in the same bucket. You can use versioning to preserve, retrieve, and restore every version of every object stored in your S3 bucket.
        </Box>
        <Form>
          <FormField label="Versioning status" description="Current status of versioning for this bucket.">
            <Select
              selectedOption={selected}
              onChange={({ detail }) => setSelected(detail.selectedOption)}
              options={VERSIONING_OPTIONS}
            />
          </FormField>
          <Button
            variant="primary"
            loading={updateVersioning.isPending}
            onClick={() => updateVersioning.mutate(selected.value as string)}
          >
            Save changes
          </Button>
          {updateVersioning.isError && (
            <Alert type="error" dismissible>
              {(updateVersioning.error as Error)?.message || "Failed to update versioning"}
            </Alert>
          )}
        </Form>
      </SpaceBetween>
    </Container>
  );
}

function BucketTags({ bucket }: Props) {
  const { data, isLoading } = useS3BucketTags(bucket);
  const updateTags = useS3UpdateBucketTags(bucket);
  const [tagPairs, setTagPairs] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    if (data?.tags) {
      setTagPairs(data.tags.map((t) => ({ key: t.Key, value: t.Value })));
    }
  }, [data?.tags]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Bucket Tags</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Tags are key-value pairs you can assign to your bucket for organization and cost allocation.
        </Box>
        <SpaceBetween size="s">
          {tagPairs.map((tag, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <FormField label={i === 0 ? "Key" : ""}>
                  <Input
                    value={tag.key}
                    onChange={({ detail }) =>
                      setTagPairs((prev) => prev.map((t, idx) => (idx === i ? { ...t, key: detail.value } : t)))
                    }
                    placeholder="Tag key"
                  />
                </FormField>
              </div>
              <div style={{ flex: 1 }}>
                <FormField label={i === 0 ? "Value" : ""}>
                  <Input
                    value={tag.value}
                    onChange={({ detail }) =>
                      setTagPairs((prev) => prev.map((t, idx) => (idx === i ? { ...t, value: detail.value } : t)))
                    }
                    placeholder="Tag value"
                  />
                </FormField>
              </div>
              <Button
                variant="icon"
                iconName="remove"
                ariaLabel="Remove tag"
                onClick={() => setTagPairs((prev) => prev.filter((_, idx) => idx !== i))}
              />
            </div>
          ))}
          <Button
            variant="normal"
            iconName="add-plus"
            onClick={() => setTagPairs((prev) => [...prev, { key: "", value: "" }])}
          >
            Add tag
          </Button>
        </SpaceBetween>
        <Button
          variant="primary"
          loading={updateTags.isPending}
          onClick={() => {
            const validTags = tagPairs.filter((t) => t.key && t.value).map((t) => ({ Key: t.key, Value: t.value }));
            updateTags.mutate(validTags);
          }}
        >
          Save tags
        </Button>
        {updateTags.isError && (
          <Alert type="error" dismissible>
            {(updateTags.error as Error)?.message || "Failed to update tags"}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

function BucketPolicy({ bucket }: Props) {
  const { data, isLoading } = useS3BucketPolicy(bucket);
  const updatePolicy = useS3UpdateBucketPolicy(bucket);
  const deletePolicy = useS3DeleteBucketPolicy(bucket);
  const [policyText, setPolicyText] = useState("");

  useEffect(() => {
    if (data?.policy) {
      try {
        setPolicyText(JSON.stringify(JSON.parse(data.policy), null, 2));
      } catch {
        setPolicyText(data.policy);
      }
    } else {
      setPolicyText("");
    }
  }, [data?.policy]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Bucket Policy</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          A bucket policy is a JSON-based resource policy that you can use to control access to your S3 bucket.
        </Box>
        <Form>
          <FormField label="Policy document" description="Enter a valid JSON bucket policy.">
            <Textarea
              value={policyText}
              onChange={({ detail }) => setPolicyText(detail.value)}
              placeholder={`{\n  "Version": "2012-10-17",\n  "Statement": []\n}`}
              rows={15}
            />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              loading={updatePolicy.isPending}
              disabled={!policyText.trim()}
              onClick={() => {
                try {
                  const parsed = JSON.parse(policyText);
                  updatePolicy.mutate(parsed);
                } catch {
                  updatePolicy.mutate(policyText);
                }
              }}
            >
              Save policy
            </Button>
            {data?.hasPolicy && (
              <Button
                variant="normal"
                loading={deletePolicy.isPending}
                onClick={() => deletePolicy.mutate()}
              >
                Delete policy
              </Button>
            )}
          </SpaceBetween>
        </Form>
        {updatePolicy.isError && (
          <Alert type="error" dismissible>
            {(updatePolicy.error as Error)?.message || "Failed to update policy"}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

function BucketEncryption({ bucket }: Props) {
  const { data, isLoading } = useS3BucketEncryption(bucket);
  const updateEncryption = useS3UpdateBucketEncryption(bucket);
  const deleteEncryption = useS3DeleteBucketEncryption(bucket);
  const [selected, setSelected] = useState<SelectProps.Option>(ENCRYPTION_OPTIONS[0]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Default Encryption</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          When you enable default encryption, new objects stored in this bucket are automatically encrypted with the specified algorithm.
        </Box>
        <Form>
          <FormField label="Encryption algorithm">
            <Select
              selectedOption={selected}
              onChange={({ detail }) => setSelected(detail.selectedOption)}
              options={ENCRYPTION_OPTIONS}
            />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              loading={updateEncryption.isPending}
              onClick={() => updateEncryption.mutate(selected.value as string)}
            >
              Enable encryption
            </Button>
            {data?.configured && (
              <Button
                variant="normal"
                loading={deleteEncryption.isPending}
                onClick={() => deleteEncryption.mutate()}
              >
                Disable encryption
              </Button>
            )}
          </SpaceBetween>
        </Form>
        {updateEncryption.isError && (
          <Alert type="error" dismissible>
            {(updateEncryption.error as Error)?.message || "Failed to update encryption"}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

function BucketLifecycle({ bucket }: Props) {
  const { data, isLoading } = useS3BucketLifecycle(bucket);
  const updateLifecycle = useS3UpdateBucketLifecycle(bucket);
  const deleteLifecycle = useS3DeleteBucketLifecycle(bucket);

  const [rules, setRules] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);

  // Form state for a single rule
  const [ruleId, setRuleId] = useState("");
  const [ruleStatus, setRuleStatus] = useState<SelectProps.Option>({ label: "Enabled", value: "Enabled" });
  const [rulePrefix, setRulePrefix] = useState("");
  const [expirationDays, setExpirationDays] = useState("");
  const [expirationDeleteMarker, setExpirationDeleteMarker] = useState(false);
  const [noncurrentDays, setNoncurrentDays] = useState("");
  const [abortMultipartDays, setAbortMultipartDays] = useState("");
  const [transitionClass, setTransitionClass] = useState<SelectProps.Option>({ label: "GLACIER", value: "GLACIER" });
  const [transitionDays, setTransitionDays] = useState("");

  useEffect(() => {
    if (data?.rules) setRules(data.rules);
  }, [data?.rules]);

  function resetForm() {
    setRuleId("");
    setRuleStatus({ label: "Enabled", value: "Enabled" });
    setRulePrefix("");
    setExpirationDays("");
    setExpirationDeleteMarker(false);
    setNoncurrentDays("");
    setAbortMultipartDays("");
    setTransitionClass({ label: "GLACIER", value: "GLACIER" });
    setTransitionDays("");
    setEditingIndex(null);
  }

  function loadRuleIntoForm(rule: any) {
    setRuleId(rule.id || "");
    setRuleStatus({ label: rule.status || "Enabled", value: rule.status || "Enabled" });
    setRulePrefix(rule.prefix || rule.Filter?.Prefix || "");
    setExpirationDays(rule.expiration?.Days?.toString() || "");
    setExpirationDeleteMarker(!!rule.expiration?.ExpiredObjectDeleteMarker);
    setNoncurrentDays(rule.noncurrentVersionExpiration?.NoncurrentDays?.toString() || "");
    setAbortMultipartDays(rule.abortIncompleteMultipartUpload?.DaysAfterInitiation?.toString() || "");
    if (rule.transitions?.length > 0) {
      setTransitionClass({ label: rule.transitions[0].StorageClass, value: rule.transitions[0].StorageClass });
      setTransitionDays(rule.transitions[0].Days?.toString() || "");
    } else {
      setTransitionClass({ label: "GLACIER", value: "GLACIER" });
      setTransitionDays("");
    }
  }

  function buildRule(): any {
    const rule: any = {
      Status: ruleStatus.value,
    };
    if (ruleId) rule.ID = ruleId;
    if (rulePrefix) rule.Filter = { Prefix: rulePrefix };

    if (expirationDays) {
      rule.Expiration = { Days: parseInt(expirationDays) };
    } else if (expirationDeleteMarker) {
      rule.Expiration = { ExpiredObjectDeleteMarker: true };
    }

    if (noncurrentDays) {
      rule.NoncurrentVersionExpiration = { NoncurrentDays: parseInt(noncurrentDays) };
    }

    if (abortMultipartDays) {
      rule.AbortIncompleteMultipartUpload = { DaysAfterInitiation: parseInt(abortMultipartDays) };
    }

    if (transitionDays) {
      rule.Transitions = [{
        StorageClass: transitionClass.value,
        Days: parseInt(transitionDays),
      }];
    }

    return rule;
  }

  function handleAddOrUpdate() {
    const rule = buildRule();
    let updated: any[];
    if (editingIndex !== null) {
      updated = rules.map((r, i) => (i === editingIndex ? rule : r));
    } else {
      updated = [...rules, rule];
    }
    updateLifecycle.mutate(updated, {
      onSuccess: () => {
        setRules(updated);
        setShowAddRule(false);
        resetForm();
      },
    });
  }

  function handleDeleteRule(index: number) {
    const updated = rules.filter((_, i) => i !== index);
    updateLifecycle.mutate(updated, {
      onSuccess: () => setRules(updated),
    });
  }

  function handleDeleteAll() {
    deleteLifecycle.mutate(undefined, {
      onSuccess: () => setRules([]),
    });
  }

  function handleEditRule(index: number) {
    loadRuleIntoForm(rules[index]);
    setEditingIndex(index);
    setShowAddRule(true);
  }

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Lifecycle Rules</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Lifecycle rules help you manage objects in your bucket by defining transitions and expiration policies.
        </Box>
        {(rules.length ?? 0) > 0 ? (
          <Table
            header={
              <Header
                variant="h3"
                counter={`(${rules.length})`}
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="primary" onClick={() => { resetForm(); setShowAddRule(true); }}>
                      Add rule
                    </Button>
                    <Button variant="normal" onClick={handleDeleteAll} loading={deleteLifecycle.isPending}>
                      Delete all
                    </Button>
                  </SpaceBetween>
                }
              >
                Rules
              </Header>
            }
            columnDefinitions={[
              { id: "id", header: "ID", cell: (item: any) => item.id || item.ID || "—" },
              { id: "status", header: "Status", cell: (item: any) => (
                <StatusIndicator type={item.status === "Enabled" ? "success" : "info"}>
                  {item.status || item.Status || "—"}
                </StatusIndicator>
              )},
              { id: "prefix", header: "Filter", cell: (item: any) => {
                const filter = item.Filter || item.filter;
                if (filter?.Prefix) return `Prefix: ${filter.Prefix}`;
                if (filter?.Tag) return `Tag: ${filter.Tag.Key}=${filter.Tag.Value}`;
                return "All objects";
              }},
              { id: "expiration", header: "Expiration", cell: (item: any) => {
                const exp = item.expiration || item.Expiration;
                if (exp?.Days) return `${exp.Days} days`;
                if (exp?.ExpiredObjectDeleteMarker) return "Delete markers";
                return "—";
              }},
              { id: "transition", header: "Transition", cell: (item: any) => {
                const trans = item.transitions?.[0] || item.Transitions?.[0];
                if (trans) return `${trans.StorageClass} after ${trans.Days} days`;
                return "—";
              }},
              { id: "actions", header: "", cell: (item: any) => {
                const idx = rules.indexOf(item);
                return (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="icon" iconName="edit" ariaLabel="Edit rule" onClick={() => handleEditRule(idx)} />
                    <Button variant="icon" iconName="remove" ariaLabel="Delete rule" onClick={() => handleDeleteRule(idx)} />
                  </SpaceBetween>
                );
              }},
            ]}
            items={rules}
          />
        ) : (
          <Box color="text-body-secondary">No lifecycle rules configured.</Box>
        )}
        {rules.length === 0 && (
          <Button variant="primary" onClick={() => { resetForm(); setShowAddRule(true); }}>
            Add lifecycle rule
          </Button>
        )}

        {/* Add/Edit rule modal */}
        <Modal
          visible={showAddRule}
          onDismiss={() => { setShowAddRule(false); resetForm(); }}
          header={editingIndex !== null ? "Edit lifecycle rule" : "Add lifecycle rule"}
          size="large"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setShowAddRule(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={updateLifecycle.isPending}
                  onClick={handleAddOrUpdate}
                >
                  {editingIndex !== null ? "Update rule" : "Add rule"}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            {updateLifecycle.isError && (
              <Alert type="error" dismissible>
                {(updateLifecycle.error as Error)?.message || "Failed to update lifecycle rules"}
              </Alert>
            )}
            <SpaceBetween size="m">
              <FormField label="Rule ID" description="Optional unique identifier for this rule.">
                <Input value={ruleId} onChange={({ detail }) => setRuleId(detail.value)} placeholder="e.g. expire-old-logs" />
              </FormField>

              <FormField label="Status">
                <Select
                  selectedOption={ruleStatus}
                  onChange={({ detail }) => setRuleStatus(detail.selectedOption)}
                  options={[{ label: "Enabled", value: "Enabled" }, { label: "Disabled", value: "Disabled" }]}
                />
              </FormField>

              <FormField label="Filter prefix" description="Apply this rule only to objects with this prefix. Leave empty to apply to all objects.">
                <Input value={rulePrefix} onChange={({ detail }) => setRulePrefix(detail.value)} placeholder="e.g. logs/" />
              </FormField>

              <Box variant="h3">Expiration</Box>
              <FormField label="Expire after (days)" description="Delete objects after this many days.">
                <Input value={expirationDays} onChange={({ detail }) => setExpirationDays(detail.value)} placeholder="e.g. 90" type="number" />
              </FormField>
              <Toggle checked={expirationDeleteMarker} onChange={({ detail }) => setExpirationDeleteMarker(detail.checked)}>
                Delete expired object delete markers
              </Toggle>

              <Box variant="h3">Noncurrent version expiration</Box>
              <FormField label="Noncurrent days" description="Delete noncurrent object versions after this many days.">
                <Input value={noncurrentDays} onChange={({ detail }) => setNoncurrentDays(detail.value)} placeholder="e.g. 30" type="number" />
              </FormField>

              <Box variant="h3">Transition</Box>
              <FormField label="Storage class" description="Transition objects to this storage class.">
                <Select
                  selectedOption={transitionClass}
                  onChange={({ detail }) => setTransitionClass(detail.selectedOption)}
                  options={STORAGE_CLASSES}
                />
              </FormField>
              <FormField label="Transition after (days)" description="Move objects to the selected storage class after this many days.">
                <Input value={transitionDays} onChange={({ detail }) => setTransitionDays(detail.value)} placeholder="e.g. 30" type="number" />
              </FormField>

              <Box variant="h3">Abort incomplete multipart upload</Box>
              <FormField label="Days after initiation" description="Abort incomplete multipart uploads after this many days.">
                <Input value={abortMultipartDays} onChange={({ detail }) => setAbortMultipartDays(detail.value)} placeholder="e.g. 7" type="number" />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </SpaceBetween>
    </Container>
  );
}

function BucketCors({ bucket }: Props) {
  const { data, isLoading } = useS3BucketCors(bucket);
  const updateCors = useS3UpdateBucketCors(bucket);
  const deleteCors = useS3DeleteBucketCors(bucket);
  const [rulesText, setRulesText] = useState("");

  useEffect(() => {
    if (data?.rules && data.rules.length > 0) {
      setRulesText(JSON.stringify(data.rules, null, 2));
    } else {
      setRulesText(JSON.stringify([{
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "HEAD"],
        AllowedOrigins: ["*"],
      }], null, 2));
    }
  }, [data?.rules]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">CORS Configuration</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Cross-Origin Resource Sharing (CORS) defines a way for client web applications to interact with resources in a different origin.
        </Box>
        <Form>
          <FormField label="CORS rules" description="Enter a JSON array of CORS rule objects.">
            <Textarea
              value={rulesText}
              onChange={({ detail }) => setRulesText(detail.value)}
              rows={12}
            />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              loading={updateCors.isPending}
              onClick={() => {
                try {
                  const parsed = JSON.parse(rulesText);
                  updateCors.mutate(Array.isArray(parsed) ? parsed : [parsed]);
                } catch (e) {
                  /* ignore */
                }
              }}
            >
              Save CORS rules
            </Button>
            {(data?.total ?? 0) > 0 && (
              <Button
                variant="normal"
                loading={deleteCors.isPending}
                onClick={() => deleteCors.mutate()}
              >
                Delete CORS
              </Button>
            )}
          </SpaceBetween>
        </Form>
      </SpaceBetween>
    </Container>
  );
}

function BucketWebsite({ bucket }: Props) {
  const { data, isLoading } = useS3BucketWebsite(bucket);
  const updateWebsite = useS3UpdateBucketWebsite(bucket);
  const deleteWebsite = useS3DeleteBucketWebsite(bucket);
  const [indexDoc, setIndexDoc] = useState("");
  const [errorDoc, setErrorDoc] = useState("");

  useEffect(() => {
    if (data?.configured) {
      setIndexDoc(data.indexDocument || "");
      setErrorDoc(data.errorDocument || "");
    }
  }, [data?.configured, data?.indexDocument, data?.errorDocument]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Static Website Hosting</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          S3 can host a static website with index and error documents. The website endpoint is: <code>http://{bucket}.s3-website-{process.env.AWS_REGION || "us-east-1"}.amazonaws.com</code>
        </Box>
        <Form>
          <FormField label="Index document" description="The default file served when a visitor requests the root URL (e.g., index.html).">
            <Input value={indexDoc} onChange={({ detail }) => setIndexDoc(detail.value)} placeholder="index.html" />
          </FormField>
          <FormField label="Error document" description="The file served when a 4xx error occurs (e.g., error.html).">
            <Input value={errorDoc} onChange={({ detail }) => setErrorDoc(detail.value)} placeholder="error.html" />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              loading={updateWebsite.isPending}
              disabled={!indexDoc.trim()}
              onClick={() => updateWebsite.mutate({ indexDocument: indexDoc, errorDocument: errorDoc })}
            >
              Save website configuration
            </Button>
            {data?.configured && (
              <Button
                variant="normal"
                loading={deleteWebsite.isPending}
                onClick={() => deleteWebsite.mutate()}
              >
                Disable website hosting
              </Button>
            )}
          </SpaceBetween>
        </Form>
      </SpaceBetween>
    </Container>
  );
}

function BucketNotifications({ bucket }: Props) {
  const { data, isLoading } = useS3BucketNotifications(bucket);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Event Notifications</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Configure S3 to send event notifications to Lambda functions, SQS queues, or SNS topics when objects are created, deleted, or modified.
        </Box>
        {(data?.total ?? 0) > 0 ? (
          <Table
            header={<Header variant="h3" counter={`(${data?.total || 0})`}>Active Notifications</Header>}
            columnDefinitions={[
              { id: "type", header: "Type", cell: (item: any) => {
                if (item.LambdaFunctionArn) return "Lambda";
                if (item.QueueArn) return "SQS";
                return "SNS";
              }},
              { id: "arn", header: "ARN", cell: (item: any) => (
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>
                  {item.LambdaFunctionArn || item.QueueArn || item.TopicArn || "—"}
                </code>
              )},
              { id: "events", header: "Events", cell: (item: any) => (
                <Box variant="small">{(item.Events || []).join(", ")}</Box>
              )},
            ]}
            items={[
              ...(data?.lambdaNotifications || []),
              ...(data?.sqsNotifications || []),
              ...(data?.snsNotifications || []),
            ]}
          />
        ) : (
          <Box color="text-body-secondary">No event notifications configured.</Box>
        )}
      </SpaceBetween>
    </Container>
  );
}

function BucketPublicAccess({ bucket }: Props) {
  const { data, isLoading } = useS3PublicAccessBlock(bucket);
  const updatePab = useS3UpdatePublicAccessBlock(bucket);
  const [blockPublicAcls, setBlockPublicAcls] = useState(false);
  const [ignorePublicAcls, setIgnorePublicAcls] = useState(false);
  const [blockPublicPolicy, setBlockPublicPolicy] = useState(false);
  const [restrictPublicBuckets, setRestrictPublicBuckets] = useState(false);

  useEffect(() => {
    if (data) {
      setBlockPublicAcls(data.blockPublicAcls);
      setIgnorePublicAcls(data.ignorePublicAcls);
      setBlockPublicPolicy(data.blockPublicPolicy);
      setRestrictPublicBuckets(data.restrictPublicBuckets);
    }
  }, [data]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Public Access Block Configuration</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Block public access settings for this bucket. These settings apply to bucket policies, ACLs, and public access points.
        </Box>
        <SpaceBetween size="s">
          <Toggle checked={blockPublicAcls} onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) => setBlockPublicAcls(detail.checked)}>
            Block all public ACLs
          </Toggle>
          <Toggle checked={ignorePublicAcls} onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) => setIgnorePublicAcls(detail.checked)}>
            Ignore all public ACLs
          </Toggle>
          <Toggle checked={blockPublicPolicy} onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) => setBlockPublicPolicy(detail.checked)}>
            Block all public bucket policies
          </Toggle>
          <Toggle checked={restrictPublicBuckets} onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) => setRestrictPublicBuckets(detail.checked)}>
            Restrict access to bucket with public policies
          </Toggle>
        </SpaceBetween>
        <Button
          variant="primary"
          loading={updatePab.isPending}
          onClick={() =>
            updatePab.mutate({
              blockPublicAcls,
              ignorePublicAcls,
              blockPublicPolicy,
              restrictPublicBuckets,
            })
          }
        >
          Save settings
        </Button>
        {updatePab.isError && (
          <Alert type="error" dismissible>
            {(updatePab.error as Error)?.message || "Failed to update public access block"}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

function BucketLogging({ bucket }: Props) {
  const { data, isLoading } = useS3BucketLogging(bucket);
  const updateLogging = useS3UpdateBucketLogging(bucket);
  const [targetBucket, setTargetBucket] = useState("");
  const [targetPrefix, setTargetPrefix] = useState("");

  useEffect(() => {
    if (data) {
      setTargetBucket(data.targetBucket || "");
      setTargetPrefix(data.targetPrefix || "");
    }
  }, [data]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Server Access Logging</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Server access logging provides detailed records for the requests that are made to a bucket. Server access logs are useful for security and access auditing.
        </Box>
        <Form>
          <FormField label="Target bucket" description="The bucket where access logs will be stored.">
            <Input
              value={targetBucket}
              onChange={({ detail }) => setTargetBucket(detail.value)}
              placeholder="my-logs-bucket"
            />
          </FormField>
          <FormField label="Target prefix" description="Optional prefix for log object keys (e.g., 'logs/').">
            <Input
              value={targetPrefix}
              onChange={({ detail }) => setTargetPrefix(detail.value)}
              placeholder="logs/"
            />
          </FormField>
          <Button
            variant="primary"
            loading={updateLogging.isPending}
            disabled={!targetBucket.trim()}
            onClick={() => updateLogging.mutate({ targetBucket, targetPrefix })}
          >
            Save logging configuration
          </Button>
        </Form>
        {updateLogging.isError && (
          <Alert type="error" dismissible>
            {(updateLogging.error as Error)?.message || "Failed to update logging"}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}
