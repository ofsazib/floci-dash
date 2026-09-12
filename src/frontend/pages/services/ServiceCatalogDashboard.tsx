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
} from "@cloudscape-design/components";
import {
  useScPortfolios,
  useScCreatePortfolio,
  useScDeletePortfolio,
  useScProducts,
  useScCreateProduct,
  useScDeleteProduct,
  useScArtifacts,
  useScProvisioned,
  useScProvision,
  useScTerminateProvisioned,
  useScTagOptions,
  useScCreateTagOption,
  useScDeleteTagOption,
  useScConstraints,
  useScCreateConstraint,
  useScDeleteConstraint,
} from "../../hooks/useServiceCatalog";
import { useToast } from "../../components/Toast";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

function PortfoliosTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useScPortfolios();
  const create = useScCreatePortfolio();
  const remove = useScDeletePortfolio();

  const [showCreate, setShowCreate] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [providerName, setProviderName] = useState("");

  const portfolios: any[] = data?.portfolios || [];

  const doCreate = async () => {
    try {
      await create.mutateAsync({ displayName: displayName.trim(), providerName: providerName.trim() });
      console.log("DO_CREATE_RESUMED");
      setShowCreate(false);
      setDisplayName("");
      setProviderName("");
      showToast("success", "Portfolio created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create portfolio");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      showToast("success", "Portfolio deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete portfolio");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="portfolio"
        loading={isLoading}
        items={portfolios}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (p: any) => p.displayName || "—" },
          { id: "provider", header: "Provider", cell: (p: any) => p.providerName || "—" },
          { id: "description", header: "Description", cell: (p: any) => p.description || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (p: any) => (
              <DeleteButton itemName={p.displayName || p.id} resourceType="portfolio" onDelete={() => doDelete(p.id)} />
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create portfolio"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!displayName.trim() || !providerName.trim() || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Display name">
            <Input value={displayName} onChange={({ detail }) => setDisplayName(detail.value)} placeholder="dev-portfolio" />
          </FormField>
          <FormField label="Provider name">
            <Input value={providerName} onChange={({ detail }) => setProviderName(detail.value)} placeholder="it-dept" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function ProductsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useScProducts();
  const create = useScCreateProduct();
  const remove = useScDeleteProduct();
  const provision = useScProvision();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [provisioningFor, setProvisioningFor] = useState<any>(null);
  const [artifactId, setArtifactId] = useState("");
  const [provisionedName, setProvisionedName] = useState("");

  const products: any[] = data?.products || [];
  const { data: artifactData } = useScArtifacts(provisioningFor?.id ?? null);
  const artifacts: any[] = artifactData?.artifacts || [];

  const doCreate = async () => {
    try {
      await create.mutateAsync({ name: name.trim(), owner: owner.trim() });
      setShowCreate(false);
      setName("");
      setOwner("");
      showToast("success", "Product created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create product");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      showToast("success", "Product deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete product");
    }
  };

  const doProvision = async () => {
    try {
      await provision.mutateAsync({
        provisionedName: provisionedName.trim(),
        productId: provisioningFor.id,
        artifactId,
      });
      setProvisioningFor(null);
      setArtifactId("");
      setProvisionedName("");
      showToast("success", "Provisioning started");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to provision product");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="product"
        loading={isLoading}
        items={products}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (p: any) => p.name || "—" },
          { id: "owner", header: "Owner", cell: (p: any) => p.owner || "—" },
          { id: "status", header: "Status", cell: (p: any) => p.status || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (p: any) => (
              <SpaceBetween size="xxs" direction="horizontal">
                <Button
                  ariaLabel={`Provision ${p.id}`}
                  disabled={!p.id}
                  onClick={() => setProvisioningFor(p)}
                >
                  Provision
                </Button>
                <DeleteButton itemName={p.name || p.id} resourceType="product" onDelete={() => doDelete(p.id)} />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create product"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!name.trim() || !owner.trim() || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-product" />
          </FormField>
          <FormField label="Owner">
            <Input value={owner} onChange={({ detail }) => setOwner(detail.value)} placeholder="platform-team" />
          </FormField>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={!!provisioningFor}
        onDismiss={() => setProvisioningFor(null)}
        header={`Provision ${provisioningFor?.name ?? ""}`}
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setProvisioningFor(null)}>Cancel</Button>
              <Button variant="primary" onClick={doProvision} disabled={!provisionedName.trim() || !artifactId || provision.isPending}>Provision</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Provisioned product name">
            <Input value={provisionedName} onChange={({ detail }) => setProvisionedName(detail.value)} placeholder="my-stack" />
          </FormField>
          <FormField label="Provisioning artifact">
            <SpaceBetween size="xs" direction="horizontal">
              <Button
                onClick={() => setArtifactId(artifacts[0]?.id ?? "")}
                disabled={!artifacts.length}
              >
                Load artifacts
              </Button>
              <Input value={artifactId} onChange={({ detail }) => setArtifactId(detail.value)} placeholder="pa-xxxx" />
            </SpaceBetween>
            {artifacts.length ? (
              <Box>{artifacts.map((a: any) => `${a.name} (${a.id})`).join(", ")}</Box>
            ) : null}
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function ProvisionedTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useScProvisioned();
  const terminate = useScTerminateProvisioned();

  const rows: any[] = data?.provisionedProducts || [];

  const doTerminate = async (id: string) => {
    try {
      await terminate.mutateAsync(id);
      showToast("success", "Termination started");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to terminate provisioned product");
    }
  };

  return (
    <ResourceTable
      resourceName="provisioned product"
      loading={isLoading}
      items={rows}
      columns={[
        { id: "name", header: "Name", cell: (p: any) => p.name || "—" },
        { id: "status", header: "Status", cell: (p: any) => p.status || "—" },
        { id: "type", header: "Type", cell: (p: any) => p.type || "—" },
        { id: "id", header: "ID", cell: (p: any) => p.id || "—" },
        {
          id: "actions",
          header: "Actions",
          cell: (p: any) => (
            <Button ariaLabel={`Terminate ${p.id}`} onClick={() => doTerminate(p.id)}>
              Terminate
            </Button>
          ),
        },
      ]}
    />
  );
}

function TagOptionsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useScTagOptions();
  const create = useScCreateTagOption();
  const remove = useScDeleteTagOption();
  const createConstraint = useScCreateConstraint();
  const removeConstraint = useScDeleteConstraint();

  const doDeleteTagOption = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      showToast("success", "Tag option deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete tag option");
    }
  };

  const doDeleteConstraint = async (id: string) => {
    try {
      await removeConstraint.mutateAsync(id);
      showToast("success", "Constraint deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete constraint");
    }
  };

  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [constraintPortfolio, setConstraintPortfolio] = useState("");
  const [constraintProduct, setConstraintProduct] = useState("");
  const [constraintType, setConstraintType] = useState("LAUNCH");
  const [constraintParams, setConstraintParams] = useState("{}");
  const [showConstraints, setShowConstraints] = useState(false);
  const { data: constraints } = useScConstraints(showConstraints ? constraintPortfolio || null : null);

  const tagOptions: any[] = data?.tagOptions || [];
  const constraintRows: any[] = constraints?.constraints || [];

  const doCreateTag = async () => {
    try {
      await create.mutateAsync({ key: tagKey.trim(), value: tagValue.trim() });
      setTagKey("");
      setTagValue("");
      showToast("success", "Tag option created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create tag option");
    }
  };

  const doCreateConstraint = async () => {
    try {
      await createConstraint.mutateAsync({
        portfolioId: constraintPortfolio.trim(),
        productId: constraintProduct.trim(),
        type: constraintType,
        parameters: constraintParams,
      });
      showToast("success", "Constraint created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create constraint");
    }
  };

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="tag option"
        loading={isLoading}
        items={tagOptions}
        columns={[
          { id: "key", header: "Key", cell: (t: any) => t.key || "—" },
          { id: "value", header: "Value", cell: (t: any) => t.value || "—" },
          { id: "id", header: "ID", cell: (t: any) => t.id || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (t: any) => (
              <DeleteButton itemName={t.id} resourceType="tag option" onDelete={() => doDeleteTagOption(t.id)} />
            ),
          },
        ]}
      />
      <SpaceBetween size="m">
        <FormField label="Tag option key">
          <Input value={tagKey} onChange={({ detail }) => setTagKey(detail.value)} placeholder="env" />
        </FormField>
        <FormField label="Tag option value">
          <Input value={tagValue} onChange={({ detail }) => setTagValue(detail.value)} placeholder="dev" />
        </FormField>
        <Button variant="primary" disabled={!tagKey.trim() || !tagValue.trim()} onClick={doCreateTag}>
          Create tag option
        </Button>
      </SpaceBetween>
      <SpaceBetween size="m">
        <Button onClick={() => setShowConstraints(!showConstraints)}>
          {showConstraints ? "Hide constraints" : "Show constraints"}
        </Button>
        {showConstraints ? (
          <>
            <FormField label="Portfolio ID">
              <Input value={constraintPortfolio} onChange={({ detail }) => setConstraintPortfolio(detail.value)} placeholder="port-xxxx" />
            </FormField>
            {constraintRows.length ? (
              <ResourceTable
                resourceName="constraint"
                items={constraintRows}
                columns={[
                  { id: "id", header: "ID", cell: (c: any) => c.id || "—" },
                  { id: "type", header: "Type", cell: (c: any) => c.type || "—" },
                  { id: "product", header: "Product", cell: (c: any) => c.productId || "—" },
                  {
                    id: "actions",
                    header: "Actions",
                    cell: (c: any) => (
                      <DeleteButton itemName={c.id} resourceType="constraint" onDelete={() => doDeleteConstraint(c.id)} />
                    ),
                  },
                ]}
              />
            ) : null}
            <FormField label="Constraint product ID">
              <Input value={constraintProduct} onChange={({ detail }) => setConstraintProduct(detail.value)} placeholder="prod-xxxx" />
            </FormField>
            <FormField label="Constraint type">
              <Button
                onClick={() => setConstraintType(constraintType === "LAUNCH" ? "STACKSET" : "LAUNCH")}
              >
                {constraintType}
              </Button>
            </FormField>
            <FormField label="Parameters (JSON)">
              <Textarea value={constraintParams} onChange={({ detail }) => setConstraintParams(detail.value)} rows={3} />
            </FormField>
            <Button
              variant="primary"
              disabled={!constraintPortfolio.trim() || !constraintProduct.trim()}
              onClick={doCreateConstraint}
            >
              Create constraint
            </Button>
          </>
        ) : null}
      </SpaceBetween>
    </SpaceBetween>
  );
}

export default function ServiceCatalogDashboard() {
  return (
    <Tabs
      tabs={[
        { id: "portfolios", label: "Portfolios", content: <PortfoliosTab /> },
        { id: "products", label: "Products", content: <ProductsTab /> },
        { id: "provisioned", label: "Provisioned products", content: <ProvisionedTab /> },
        { id: "tagoptions", label: "Tag options & constraints", content: <TagOptionsTab /> },
      ]}
    />
  );
}
