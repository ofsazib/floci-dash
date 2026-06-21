import { useState, useMemo } from "react";
import {
  Box,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Select,
  Button,
  Alert,
  Container,
  ColumnLayout,
  Spinner,
  Tabs,
  type SelectProps,
} from "@cloudscape-design/components";
import {
  useDynamoDBTableDetail,
  useDynamoDBDeleteItem,
  useDynamoDBPutItem,
  useDynamoDBFilteredScan,
  type FilterParams,
} from "../hooks/useDynamoDB";
import ResourceTable from "./ResourceTable";
import DeleteButton from "./DeleteButton";
import StatCard from "./StatCard";
import DynamoDBAdvanced from "./DynamoDBAdvanced";
import { formatBytes, formatItemValue } from "../lib/utils";

const FILTER_OPERATORS: SelectProps.Option[] = [
  { label: "=", value: "=" },
  { label: "<>", value: "<>" },
  { label: "<", value: "<" },
  { label: ">", value: ">" },
  { label: "<=", value: "<=" },
  { label: ">=", value: ">=" },
  { label: "Begins with", value: "BEGINS_WITH" },
  { label: "Contains", value: "CONTAINS" },
  { label: "Exists", value: "EXISTS" },
  { label: "Not exists", value: "NOT_EXISTS" },
];

const OPS_WITHOUT_VALUE = new Set(["EXISTS", "NOT_EXISTS"]);

const FILTER_LOGIC_OPTIONS: SelectProps.Option[] = [
  { label: "AND — all conditions must match", value: "AND" },
  { label: "OR — any condition must match", value: "OR" },
];

function pickKey(
  item: Record<string, any>,
  hashKey?: string,
  rangeKey?: string
): Record<string, any> {
  const key: Record<string, any> = {};
  if (hashKey) key[hashKey] = item[hashKey];
  if (rangeKey) key[rangeKey] = item[rangeKey];
  return key;
}

export default function DynamoDBTableDetail({
  tableName,
  onBack,
}: {
  tableName: string;
  onBack: () => void;
}) {
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
  } = useDynamoDBTableDetail(tableName);
  const deleteItem = useDynamoDBDeleteItem(tableName);
  const putItem = useDynamoDBPutItem(tableName);

  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(
    null
  );
  const [quickAttrName, setQuickAttrName] = useState("");
  const [quickAttrValue, setQuickAttrValue] = useState("");
  const [showPutItem, setShowPutItem] = useState(false);
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [extraAttrs, setExtraAttrs] = useState<
    Array<{ key: string; value: string }>
  >([]);

  // Update Item state
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [editKeyValues, setEditKeyValues] = useState<Record<string, string>>(
    {}
  );
  const [editExtraAttrs, setEditExtraAttrs] = useState<
    Array<{ key: string; value: string }>
  >([]);

  // Multi-condition filter state
  const [filterConditions, setFilterConditions] = useState<
    Array<{
      attr: string;
      op: SelectProps.Option;
      value: string;
      enabled: boolean;
    }>
  >([{ attr: "", op: FILTER_OPERATORS[0], value: "", enabled: true }]);
  const [filterLogic, setFilterLogic] = useState<SelectProps.Option>(
    FILTER_LOGIC_OPTIONS[0]
  );
  const [activeFilters, setActiveFilters] = useState<FilterParams | null>(null);

  // Filter presets (localStorage-backed)
  interface SavedPreset {
    name: string;
    conditions: Array<{
      attr: string;
      op: string;
      value: string;
      enabled: boolean;
    }>;
    logic: "AND" | "OR";
  }
  const PRESETS_KEY = "floci-dash-dynamodb-presets";

  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showManagePresets, setShowManagePresets] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [tablePresets, setTablePresets] = useState<SavedPreset[]>(() => {
    try {
      const all = JSON.parse(
        localStorage.getItem(PRESETS_KEY) || "{}"
      );
      return all[tableName] || [];
    } catch {
      return [];
    }
  });

  function savePresets(presets: SavedPreset[]) {
    try {
      const all = JSON.parse(
        localStorage.getItem(PRESETS_KEY) || "{}"
      );
      all[tableName] = presets;
      localStorage.setItem(PRESETS_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
    setTablePresets(presets);
  }

  function handleSavePreset() {
    if (!presetName) return;
    const validConditions = filterConditions.filter((c) => c.attr);
    if (validConditions.length === 0) return;
    const newPreset: SavedPreset = {
      name: presetName,
      conditions: validConditions.map((c) => ({
        attr: c.attr,
        op: c.op.value ?? "=",
        value: c.value,
        enabled: c.enabled,
      })),
      logic: (filterLogic.value as "AND" | "OR") ?? "AND",
    };
    savePresets([...tablePresets, newPreset]);
    setShowSavePreset(false);
    setPresetName("");
  }

  function handleLoadPreset(preset: SavedPreset) {
    setFilterConditions(
      preset.conditions.map((c) => ({
        attr: c.attr,
        op:
          FILTER_OPERATORS.find((o) => o.value === c.op) || FILTER_OPERATORS[0],
        value: c.value,
        enabled: c.enabled ?? true,
      }))
    );
    setFilterLogic(
      FILTER_LOGIC_OPTIONS.find((o) => o.value === preset.logic) ||
        FILTER_LOGIC_OPTIONS[0]
    );
  }

  function handleDeletePreset(name: string) {
    savePresets(tablePresets.filter((p) => p.name !== name));
  }

  // Pagination state
  const [pageCursors, setPageCursors] = useState<
    Array<Record<string, any> | null>
  >([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const cursor = pageCursors[pageIndex];

  const {
    data: scan,
    isLoading: scanLoading,
    isError: scanError,
    error: scanErr,
  } = useDynamoDBFilteredScan(tableName, activeFilters, cursor);

  // Store lastEvaluatedKey for the next page when scan completes
  const pageLastEvaluatedKey = scan?.lastEvaluatedKey;

  function goToNextPage() {
    if (!pageLastEvaluatedKey) return;
    setPageCursors((prev) => {
      const next = [...prev];
      next[pageIndex + 1] = pageLastEvaluatedKey;
      return next;
    });
    setPageIndex((prev) => prev + 1);
  }

  function goToPrevPage() {
    setPageIndex((prev) => Math.max(0, prev - 1));
  }

  function resetPagination() {
    setPageCursors([null]);
    setPageIndex(0);
  }

  function handleApplyFilters() {
    const valid = filterConditions.filter(
      (c) =>
        c.enabled &&
        c.attr &&
        (OPS_WITHOUT_VALUE.has(c.op.value ?? "") || c.value)
    );
    if (valid.length === 0) return;
    resetPagination();
    setActiveFilters({
      filters: valid.map((c) => ({
        attribute: c.attr,
        operator: c.op.value ?? "=",
        value: OPS_WITHOUT_VALUE.has(c.op.value ?? "") ? true : c.value,
      })),
      logic: (filterLogic.value as "AND" | "OR") ?? "AND",
    });
  }

  function handleClearFilters() {
    setActiveFilters(null);
    setFilterConditions([
      { attr: "", op: FILTER_OPERATORS[0], value: "", enabled: true },
    ]);
    setFilterLogic(FILTER_LOGIC_OPTIONS[0]);
    resetPagination();
  }

  if (detailError || scanError) {
    return (
      <SpaceBetween size="l">
        <Button variant="link" onClick={onBack}>
          ← Tables
        </Button>
        <StatusIndicator type="error">
          {(detailErr as Error)?.message ||
            (scanErr as Error)?.message ||
            "Failed to load table details"}
        </StatusIndicator>
      </SpaceBetween>
    );
  }

  if (detailLoading || scanLoading) {
    return (
      <SpaceBetween size="l">
        <Button variant="link" onClick={onBack}>
          ← Tables
        </Button>
        <Box textAlign="center" padding={{ top: "xxxl" }}>
          <Spinner size="large" />
          <Box variant="p" padding={{ top: "m" }} color="text-body-secondary">
            Loading table details...
          </Box>
        </Box>
      </SpaceBetween>
    );
  }

  const items = scan?.items || [];
  const schema = detail?.keySchema || [];
  const hashKeyAttr = schema.find((k) => k.KeyType === "HASH")?.AttributeName;
  const rangeKeyAttr = schema.find((k) => k.KeyType === "RANGE")
    ?.AttributeName;

  // Dynamic columns: use hash key + range key + a few extra attributes
  const extraKeys = useMemo(() => {
    if (items.length === 0) return [];
    const used = new Set([hashKeyAttr, rangeKeyAttr].filter(Boolean));
    const keys = new Set<string>();
    for (const item of items) {
      for (const k of Object.keys(item)) {
        if (!used.has(k) && keys.size < 3) keys.add(k);
      }
    }
    return [...keys];
  }, [items, hashKeyAttr, rangeKeyAttr]);

  const itemColumns = useMemo(() => {
    const cols: Array<{
      id: string;
      header: string;
      cell: (item: any) => React.ReactNode;
      isRowHeader?: boolean;
    }> = [];

    if (hashKeyAttr) {
      cols.push({
        id: hashKeyAttr,
        header: hashKeyAttr,
        cell: (item: any) => item[hashKeyAttr] ?? "—",
        isRowHeader: true,
      });
    }
    if (rangeKeyAttr) {
      cols.push({
        id: rangeKeyAttr,
        header: rangeKeyAttr,
        cell: (item: any) => item[rangeKeyAttr] ?? "—",
      });
    }
    for (const key of extraKeys) {
      cols.push({
        id: key,
        header: key,
        cell: (item: any) => {
          const val = item[key];
          return val !== undefined ? String(val).slice(0, 60) : "—";
        },
      });
    }
    cols.push({
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setSelectedItem(item)}>
            View
          </Button>
          <Button
            variant="normal"
            onClick={() => {
              const keys: Record<string, string> = {};
              const extras: Array<{ key: string; value: string }> = [];
              for (const [k, v] of Object.entries(item)) {
                const val = typeof v === "string" ? v : JSON.stringify(v);
                if (k === hashKeyAttr || k === rangeKeyAttr) {
                  keys[k] = val;
                } else {
                  extras.push({ key: k, value: val });
                }
              }
              setEditItem(item);
              setEditKeyValues(keys);
              setEditExtraAttrs(extras);
            }}
          >
            Edit
          </Button>
          <DeleteButton
            itemName={`item in ${tableName}`}
            resourceType="item"
            loading={deleteItem.isPending}
            onDelete={() =>
              deleteItem.mutateAsync(pickKey(item, hashKeyAttr, rangeKeyAttr))
            }
          />
        </SpaceBetween>
      ),
    });

    return cols;
  }, [hashKeyAttr, rangeKeyAttr, extraKeys, deleteItem]);

  return (
    <SpaceBetween size="l">
      <Button variant="link" onClick={onBack}>
        ← Tables
      </Button>

      <Box variant="h2" padding={{ bottom: "xs" }}>
        {tableName}
      </Box>

      <ColumnLayout columns={4} variant="text-grid">
        <StatCard
          label="Status"
          value={detail?.status || "—"}
          variant={detail?.status === "ACTIVE" ? "success" : "warning"}
        />
        <StatCard
          label="Item count"
          value={detail?.itemCount?.toLocaleString() || "0"}
          variant="info"
        />
        <StatCard
          label="Size"
          value={
            detail?.sizeBytes != null ? formatBytes(detail.sizeBytes) : "—"
          }
          variant="info"
        />
        <StatCard
          label="ARN"
          value={detail?.arn || "—"}
          variant="default"
          isText
        />
      </ColumnLayout>

      <ColumnLayout columns={3} variant="text-grid">
        <StatCard
          label="Partition key"
          value={
            schema.find((k) => k.KeyType === "HASH")?.AttributeName || "—"
          }
          variant="info"
        />
        <StatCard
          label="Sort key"
          value={
            schema.find((k) => k.KeyType === "RANGE")?.AttributeName || "None"
          }
          variant="default"
        />
        <StatCard
          label="Created"
          value={
            detail?.createdAt
              ? new Date(detail.createdAt).toLocaleString()
              : "—"
          }
          variant="default"
          isText
        />
      </ColumnLayout>

      <Tabs
        tabs={[
          {
            label: "Items",
            id: "items",
            content: (
              <SpaceBetween size="l">
                {/* Active filter badge */}
      {activeFilters && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 14px",
            background: "var(--color-background-container-secondary, #f2f3f3)",
            borderRadius: 8,
          }}
        >
          <StatusIndicator type="info">
            Filtered:{" "}
            {activeFilters.filters
              .map((f) =>
                `${f.attribute} ${f.operator}${
                  OPS_WITHOUT_VALUE.has(f.operator) ? "" : " " + f.value
                }`
              )
              .join(` ${activeFilters.logic} `)}
          </StatusIndicator>
          <Button variant="link" onClick={handleClearFilters}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Preset selector */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <div style={{ minWidth: 180, flex: 1 }}>
          <FormField label="Load preset">
            <Select
              selectedOption={
                tablePresets.length > 0
                  ? { label: "Select a preset...", value: "" }
                  : { label: "No saved presets", value: "" }
              }
              onChange={({ detail }) => {
                const found = tablePresets.find(
                  (p) => p.name === detail.selectedOption?.value
                );
                if (found) handleLoadPreset(found);
              }}
              options={[
                { label: "Select a preset...", value: "" },
                ...tablePresets.map((p) => ({
                  label: p.name,
                  value: p.name,
                })),
              ]}
              disabled={tablePresets.length === 0}
            />
          </FormField>
        </div>
        <Button
          variant="normal"
          iconName="add-plus"
          onClick={() => {
            setPresetName("");
            setShowSavePreset(true);
          }}
        >
          Save as preset
        </Button>
        {tablePresets.length > 0 && (
          <Button
            variant="link"
            onClick={() => setShowManagePresets(true)}
          >
            Manage ({tablePresets.length})
          </Button>
        )}
      </div>

      {/* Condition builder */}
      <div style={{ marginBottom: 8 }}>
        <FormField label="Filter logic">
          <Select
            selectedOption={filterLogic}
            onChange={({ detail }) => setFilterLogic(detail.selectedOption)}
            options={FILTER_LOGIC_OPTIONS}
          />
        </FormField>
      </div>

      <SpaceBetween size="s">
        {filterConditions.map((cond, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              flexWrap: "wrap",
              opacity: cond.enabled ? 1 : 0.45,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                marginBottom: 4,
                cursor: "pointer",
                borderRadius: 4,
                background: cond.enabled ? "var(--color-text-status-success, #037f0c)" : "var(--color-background-control-default, #d5dbdb)",
                color: cond.enabled ? "var(--color-text-status-inverted, #fff)" : "var(--color-text-body-default, inherit)",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
              onClick={() =>
                setFilterConditions((prev) =>
                  prev.map((c, idx) =>
                    idx === i ? { ...c, enabled: !c.enabled } : c
                  )
                )
              }
              title={cond.enabled ? "Disable condition" : "Enable condition"}
            >
              {cond.enabled ? "✓" : "✕"}
            </div>
            <div style={{ minWidth: 130, flex: 1 }}>
              <FormField label={i === 0 ? "Attribute" : ""}>
                <Input
                  value={cond.attr}
                  onChange={({ detail }) =>
                    setFilterConditions((prev) =>
                      prev.map((c, idx) =>
                        idx === i ? { ...c, attr: detail.value } : c
                      )
                    )
                  }
                  placeholder="e.g. status"
                />
              </FormField>
            </div>
            <div style={{ minWidth: 120 }}>
              <FormField label={i === 0 ? "Operator" : ""}>
                <Select
                  selectedOption={cond.op}
                  onChange={({ detail }) =>
                    setFilterConditions((prev) =>
                      prev.map((c, idx) =>
                        idx === i ? { ...c, op: detail.selectedOption } : c
                      )
                    )
                  }
                  options={FILTER_OPERATORS}
                />
              </FormField>
            </div>
            <div style={{ minWidth: 130, flex: 1 }}>
              <FormField label={i === 0 ? "Value" : ""}>
                <Input
                  value={cond.value}
                  onChange={({ detail }) =>
                    setFilterConditions((prev) =>
                      prev.map((c, idx) =>
                        idx === i ? { ...c, value: detail.value } : c
                      )
                    )
                  }
                  placeholder="Value"
                  disabled={OPS_WITHOUT_VALUE.has(cond.op.value ?? "")}
                />
              </FormField>
            </div>
            {filterConditions.length > 1 && (
              <Button
                variant="icon"
                iconName="remove"
                ariaLabel="Remove condition"
                onClick={() =>
                  setFilterConditions((prev) =>
                    prev.filter((_, idx) => idx !== i)
                  )
                }
              />
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            variant="normal"
            iconName="add-plus"
            onClick={() =>
              setFilterConditions((prev) => [
                ...prev,
                {
                  attr: "",
                  op: FILTER_OPERATORS[0],
                  value: "",
                  enabled: true,
                },
              ])
            }
          >
            Add condition
          </Button>
          <Button
            variant="primary"
            disabled={
              !filterConditions.some(
                (c) =>
                  c.attr &&
                  (OPS_WITHOUT_VALUE.has(c.op.value ?? "") || c.value)
              )
            }
            onClick={handleApplyFilters}
          >
            Apply filters
          </Button>
        </div>
      </SpaceBetween>

      <ResourceTable
        resourceName="Item"
        headerTitle="Items"
        headerCounter={scan?.count}
        items={items}
        columns={itemColumns}
        loading={scanLoading}
        emptyMessage="No items found"
        filterEnabled
        filterPlaceholder="Find items by value"
        filterFunction={(item: any, searchText: string) =>
          JSON.stringify(item)
            .toLowerCase()
            .includes(searchText.toLowerCase())
        }
        onCreate={() => {
          const initial: Record<string, string> = {};
          if (hashKeyAttr) initial[hashKeyAttr] = "";
          if (rangeKeyAttr) initial[rangeKeyAttr] = "";
          setKeyValues(initial);
          setExtraAttrs([{ key: "", value: "" }]);
          setShowPutItem(true);
        }}
      />

      {/* Pagination bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          padding: "4px 0",
        }}
      >
        <Button
          variant="normal"
          disabled={pageIndex === 0}
          onClick={goToPrevPage}
        >
          Previous
        </Button>
        <Box variant="small" color="text-body-secondary">
          Page {pageIndex + 1}
        </Box>
        <Button
          variant="normal"
          disabled={!pageLastEvaluatedKey}
          onClick={goToNextPage}
        >
          Next
        </Button>
      </div>
              </SpaceBetween>
            ),
          },
          {
            label: "Advanced",
            id: "advanced",
            content: <DynamoDBAdvanced tableName={tableName} tableDetail={detail} />,
          },
        ]}
      />

      {/* Put Item modal */}
      <Modal
        visible={showPutItem}
        onDismiss={() => setShowPutItem(false)}
        header={`Put item in ${tableName}`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => setShowPutItem(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={putItem.isPending}
                disabled={
                  !hashKeyAttr ||
                  !keyValues[hashKeyAttr] ||
                  (rangeKeyAttr != null && !keyValues[rangeKeyAttr])
                }
                onClick={() => {
                  const item: Record<string, any> = { ...keyValues };
                  for (const attr of extraAttrs) {
                    if (attr.key && attr.value) {
                      item[attr.key] = attr.value;
                    }
                  }
                  putItem.mutate(item, {
                    onSuccess: () => setShowPutItem(false),
                  });
                }}
              >
                Put item
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putItem.isError && (
            <Alert type="error" dismissible>
              {(putItem.error as Error)?.message || "Failed to put item"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <Box variant="h3" padding={{ bottom: "xxs" }}>
              Key attributes
            </Box>
            {hashKeyAttr && (
              <FormField
                label={hashKeyAttr}
                description="Partition key (HASH) — required"
              >
                <Input
                  value={keyValues[hashKeyAttr] ?? ""}
                  onChange={({ detail }) =>
                    setKeyValues((prev) => ({
                      ...prev,
                      [hashKeyAttr]: detail.value,
                    }))
                  }
                  placeholder="Enter partition key value"
                />
              </FormField>
            )}
            {rangeKeyAttr && (
              <FormField
                label={rangeKeyAttr}
                description="Sort key (RANGE) — required"
              >
                <Input
                  value={keyValues[rangeKeyAttr] ?? ""}
                  onChange={({ detail }) =>
                    setKeyValues((prev) => ({
                      ...prev,
                      [rangeKeyAttr]: detail.value,
                    }))
                  }
                  placeholder="Enter sort key value"
                />
              </FormField>
            )}

            <Box variant="h3" padding={{ bottom: "xxs" }}>
              Additional attributes
            </Box>
            {extraAttrs.map((attr, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Input
                    value={attr.key}
                    onChange={({ detail }) =>
                      setExtraAttrs((prev) =>
                        prev.map((a, idx) =>
                          idx === i ? { ...a, key: detail.value } : a
                        )
                      )
                    }
                    placeholder="Attribute name"
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <Input
                    value={attr.value}
                    onChange={({ detail }) =>
                      setExtraAttrs((prev) =>
                        prev.map((a, idx) =>
                          idx === i ? { ...a, value: detail.value } : a
                        )
                      )
                    }
                    placeholder="Value"
                  />
                </div>
                <Button
                  variant="icon"
                  iconName="remove"
                  ariaLabel="Remove attribute"
                  onClick={() =>
                    setExtraAttrs((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                />
              </div>
            ))}
            <Button
              variant="normal"
              iconName="add-plus"
              onClick={() =>
                setExtraAttrs((prev) => [
                  ...prev,
                  { key: "", value: "" },
                ])
              }
            >
              Add attribute
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Update Item modal */}
      <Modal
        visible={!!editItem}
        onDismiss={() => setEditItem(null)}
        header={`Update item in ${tableName}`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={putItem.isPending}
                disabled={
                  !hashKeyAttr || !editKeyValues[hashKeyAttr]
                }
                onClick={() => {
                  const updated: Record<string, any> = {
                    ...editKeyValues,
                  };
                  for (const attr of editExtraAttrs) {
                    if (attr.key && attr.value) {
                      updated[attr.key] = attr.value;
                    }
                  }
                  putItem.mutate(updated, {
                    onSuccess: () => setEditItem(null),
                  });
                }}
              >
                Save changes
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putItem.isError && (
            <Alert type="error" dismissible>
              {(putItem.error as Error)?.message ||
                "Failed to update item"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <Box variant="h3" padding={{ bottom: "xxs" }}>
              Key attributes{" "}
              <Box
                variant="small"
                color="text-body-secondary"
                display="inline"
              >
                (read-only)
              </Box>
            </Box>
            {hashKeyAttr && (
              <FormField label={hashKeyAttr}>
                <Input
                  value={editKeyValues[hashKeyAttr] ?? ""}
                  disabled
                  onChange={() => {}}
                />
              </FormField>
            )}
            {rangeKeyAttr && (
              <FormField label={rangeKeyAttr}>
                <Input
                  value={editKeyValues[rangeKeyAttr] ?? ""}
                  disabled
                  onChange={() => {}}
                />
              </FormField>
            )}

            <Box variant="h3" padding={{ bottom: "xxs" }}>
              Attributes
            </Box>
            {editExtraAttrs.map((attr, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Input
                    value={attr.key}
                    onChange={({ detail }) =>
                      setEditExtraAttrs((prev) =>
                        prev.map((a, idx) =>
                          idx === i ? { ...a, key: detail.value } : a
                        )
                      )
                    }
                    placeholder="Attribute name"
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <Input
                    value={attr.value}
                    onChange={({ detail }) =>
                      setEditExtraAttrs((prev) =>
                        prev.map((a, idx) =>
                          idx === i ? { ...a, value: detail.value } : a
                        )
                      )
                    }
                    placeholder="Value"
                  />
                </div>
                <Button
                  variant="icon"
                  iconName="remove"
                  ariaLabel="Remove attribute"
                  onClick={() =>
                    setEditExtraAttrs((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                />
              </div>
            ))}
            <Button
              variant="normal"
              iconName="add-plus"
              onClick={() =>
                setEditExtraAttrs((prev) => [
                  ...prev,
                  { key: "", value: "" },
                ])
              }
            >
              Add attribute
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Item details modal */}
      <Modal
        visible={!!selectedItem}
        onDismiss={() => {
          setSelectedItem(null);
          setQuickAttrName("");
          setQuickAttrValue("");
        }}
        header="Item details"
        size="large"
        footer={
          <Box float="right">
            <Button
              variant="primary"
              onClick={() => {
                setSelectedItem(null);
                setQuickAttrName("");
                setQuickAttrValue("");
              }}
            >
              Close
            </Button>
          </Box>
        }
      >
        <Container>
          <SpaceBetween size="xs">
            {selectedItem &&
              Object.entries(selectedItem).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "8px 12px",
                    borderRadius: 6,
                    borderBottom: "1px solid var(--color-border-divider-default, #e9ebed)",
                  }}
                >
                  <span
                    style={{
                      minWidth: 160,
                      flexShrink: 0,
                      fontWeight: 600,
                      color: "var(--color-text-body-secondary, #545b64)",
                    }}
                  >
                    {key}
                  </span>
                  <span
                    style={{
                      wordBreak: "break-all",
                      color: "var(--color-text-body-secondary, #545b64)",
                    }}
                  >
                    {formatItemValue(value)}
                  </span>
                </div>
              ))}

            {/* Quick-add attribute */}
            <div
              style={{
                marginTop: 8,
                padding: "12px 0",
                borderTop: "2px solid var(--color-border-divider-default, #e9ebed)",
              }}
            >
              <Box variant="h3" padding={{ bottom: "s" }}>
                Add attribute
              </Box>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 140, flex: 1 }}>
                  <FormField label="Name">
                    <Input
                      value={quickAttrName}
                      onChange={({ detail }) =>
                        setQuickAttrName(detail.value)
                      }
                      placeholder="attribute-name"
                    />
                  </FormField>
                </div>
                <div style={{ minWidth: 180, flex: 2 }}>
                  <FormField label="Value">
                    <Input
                      value={quickAttrValue}
                      onChange={({ detail }) =>
                        setQuickAttrValue(detail.value)
                      }
                      placeholder="Attribute value"
                    />
                  </FormField>
                </div>
                <Button
                  variant="primary"
                  disabled={
                    !quickAttrName || !quickAttrValue || !selectedItem
                  }
                  loading={putItem.isPending}
                  onClick={() => {
                    if (
                      !selectedItem ||
                      !quickAttrName ||
                      !quickAttrValue
                    )
                      return;
                    const updated = {
                      ...selectedItem,
                      [quickAttrName]: quickAttrValue,
                    };
                    putItem.mutate(updated, {
                      onSuccess: () => {
                        setSelectedItem(updated);
                        setQuickAttrName("");
                        setQuickAttrValue("");
                      },
                    });
                  }}
                >
                  Save
                </Button>
              </div>
              {putItem.isError && (
                <Box padding={{ top: "s" }}>
                  <StatusIndicator type="error">
                    {(putItem.error as Error)?.message ||
                      "Failed to add attribute"}
                  </StatusIndicator>
                </Box>
              )}
            </div>
          </SpaceBetween>
        </Container>
      </Modal>

      {/* Save preset modal */}
      <Modal
        visible={showSavePreset}
        onDismiss={() => setShowSavePreset(false)}
        header="Save filter preset"
        size="small"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => setShowSavePreset(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!presetName}
                onClick={handleSavePreset}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField
          label="Preset name"
          description="Give this filter a name so you can reuse it later."
        >
          <Input
            value={presetName}
            onChange={({ detail }) => setPresetName(detail.value)}
            placeholder="e.g. Active items"
          />
        </FormField>
      </Modal>

      {/* Manage presets modal */}
      <Modal
        visible={showManagePresets}
        onDismiss={() => setShowManagePresets(false)}
        header="Manage filter presets"
        size="medium"
        footer={
          <Box float="right">
            <Button
              variant="primary"
              onClick={() => setShowManagePresets(false)}
            >
              Close
            </Button>
          </Box>
        }
      >
        <SpaceBetween size="s">
          {tablePresets.length === 0 ? (
            <Box color="text-body-secondary">
              No presets saved for this table yet.
            </Box>
          ) : (
            tablePresets.map((p) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--color-border-divider-default, #e9ebed)",
                }}
              >
                <div>
                  <Box variant="strong">{p.name}</Box>
                  <Box variant="small" color="text-body-secondary">
                    {p.conditions
                      .map((c) =>
                        `${c.attr} ${c.op}${
                          OPS_WITHOUT_VALUE.has(c.op)
                            ? ""
                            : " " + c.value
                        }`
                      )
                      .join(` ${p.logic} `)}
                  </Box>
                </div>
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="normal"
                    onClick={() => {
                      handleLoadPreset(p);
                      setShowManagePresets(false);
                    }}
                  >
                    Load
                  </Button>
                  <DeleteButton
                    itemName={p.name}
                    resourceType="preset"
                    onDelete={() => handleDeletePreset(p.name)}
                  />
                </SpaceBetween>
              </div>
            ))
          )}
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}
