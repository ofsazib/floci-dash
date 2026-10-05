import { useState } from "react";
// V8 remaps phantom branches onto the multi-line import; no executable code here.
/* v8 ignore start */
import {
  Button,
  Container,
  Header,
  SpaceBetween,
  Box,
  Modal,
  Form,
  FormField,
  Input,
  Alert,
  CopyToClipboard,
} from "@cloudscape-design/components";
/* v8 ignore stop */
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useCaDomains,
  useCaCreateDomain,
  useCaDeleteDomain,
  useCaAuthToken,
  useCaRepositories,
  useCaCreateRepository,
  useCaDeleteRepository,
  useCaFetchEndpoint,
  useCaAssociateExternalConnection,
  useCaDisassociateExternalConnection,
  type CaDomain,
  type CaRepository,
} from "../../hooks/useCodeArtifact";

interface Status {
  type: "success" | "error";
  message: string;
}

function StatusAlert({ status, onDismiss }: { status: Status | null; onDismiss: () => void }) {
  if (!status) return null;
  return (
    <Alert type={status.type} dismissible onDismiss={onDismiss}>
      {status.message}
    </Alert>
  );
}

export default function CodeArtifactDashboard() {
  const domainsQuery = useCaDomains();
  const createDomain = useCaCreateDomain();
  const deleteDomain = useCaDeleteDomain();
  const authToken = useCaAuthToken();
  const repositoriesQuery = useCaRepositories();
  const createRepository = useCaCreateRepository();
  const deleteRepository = useCaDeleteRepository();
  const fetchEndpoint = useCaFetchEndpoint();
  const associateConnection = useCaAssociateExternalConnection();
  const disassociateConnection = useCaDisassociateExternalConnection();

  const [status, setStatus] = useState<Status | null>(null);
  const [showCreateDomain, setShowCreateDomain] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [token, setToken] = useState<{ value: string; expiration: number } | null>(null);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [repoDomain, setRepoDomain] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repoUpstreams, setRepoUpstreams] = useState("");
  const [endpoint, setEndpoint] = useState<{ repo: string; url: string } | null>(null);

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  const domains = domainsQuery.data?.domains || [];
  const repositories = repositoriesQuery.data?.repositories || [];

  function parseUpstreams(csv: string): string[] {
    return csv
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "domains",
            label: `Domains (${domains.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="domain"
                  headerTitle="Domains"
                  items={domains}
                  loading={domainsQuery.isLoading}
                  onCreate={() => setShowCreateDomain(true)}
                  onRefresh={domainsQuery.refetch}
                  columns={[
                    { id: "name", header: "Name", cell: (d: CaDomain) => d.name },
                    { id: "status", header: "Status", cell: (d: CaDomain) => d.status },
                    { id: "owner", header: "Owner", cell: (d: CaDomain) => d.owner },
                    {
                      id: "token",
                      header: "Auth token",
                      cell: (d: CaDomain) => (
                        <Button
                          onClick={() =>
                            wrap(
                              async () => {
                                const result = await authToken.mutateAsync(d.name!);
                                setToken({
                                  value: result.authorizationToken,
                                  expiration: result.expiration,
                                });
                              },
                              "Authorization token fetched."
                            )
                          }
                        >
                          Get token
                        </Button>
                      ),
                    },
                    {
                      id: "actions",
                      header: "",
                      cell: (d: CaDomain) => (
                        <DeleteButton
                          itemName={d.name!}
                          resourceType="domain"
                          loading={deleteDomain.isPending}
                          onDelete={() =>
                            wrap(
                              () => deleteDomain.mutateAsync(d.name!),
                              `Domain ${d.name} deleted.`
                            )
                          }
                        />
                      ),
                    },
                  ]}
                />
              </SpaceBetween>
            ),
          },
          {
            id: "repositories",
            label: `Repositories (${repositories.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="repository"
                  headerTitle="Repositories"
                  items={repositories}
                  loading={repositoriesQuery.isLoading}
                  onCreate={() => setShowCreateRepo(true)}
                  onRefresh={repositoriesQuery.refetch}
                  columns={[
                    { id: "name", header: "Name", cell: (r: CaRepository) => r.name },
                    { id: "domain", header: "Domain", cell: (r: CaRepository) => r.domainName },
                    { id: "description", header: "Description", cell: (r: CaRepository) => r.description },
                    {
                      id: "connections",
                      header: "External connections",
                      cell: (r: CaRepository) =>
                        (r.externalConnections || []).map((c) => c.externalConnectionName).join(", "),
                    },
                    {
                      id: "actions",
                      header: "",
                      cell: (r: CaRepository) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            onClick={() =>
                              wrap(
                                () =>
                                  associateConnection.mutateAsync({
                                    domain: r.domainName!,
                                    repository: r.name!,
                                    externalConnection: "public:npmjs",
                                  }),
                                `public:npmjs associated with ${r.name}.`
                              )
                            }
                          >
                            Connect npmjs
                          </Button>
                          <Button
                            onClick={() =>
                              wrap(
                                () =>
                                  disassociateConnection.mutateAsync({
                                    domain: r.domainName!,
                                    repository: r.name!,
                                    externalConnection: "public:npmjs",
                                  }),
                                `public:npmjs disassociated from ${r.name}.`
                              )
                            }
                          >
                            Disconnect
                          </Button>
                          <Button
                            onClick={() =>
                              wrap(
                                async () => {
                                  const result = await fetchEndpoint.mutateAsync({
                                    domain: r.domainName!,
                                    repository: r.name!,
                                  });
                                  setEndpoint({ repo: r.name!, url: result.repositoryEndpoint });
                                },
                                `Endpoint fetched for ${r.name}.`
                              )
                            }
                          >
                            Endpoint
                          </Button>
                          <DeleteButton
                            itemName={r.name!}
                            resourceType="repository"
                            loading={deleteRepository.isPending}
                            onDelete={() =>
                              wrap(
                                () =>
                                  deleteRepository.mutateAsync({
                                    domain: r.domainName!,
                                    name: r.name!,
                                  }),
                                `Repository ${r.name} deleted.`
                              )
                            }
                          />
                        </SpaceBetween>
                      ),
                    },
                  ]}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreateDomain}
        onDismiss={() => setShowCreateDomain(false)}
        header="Create domain"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Domain name">
              <Input value={domainName} onChange={({ detail }) => setDomainName(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateDomain(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!domainName}
                  loading={createDomain.isPending}
                  onClick={() =>
                    wrap(
                      () => createDomain.mutateAsync({ name: domainName }),
                      `Domain ${domainName} created.`
                    ).then(() => {
                      setShowCreateDomain(false);
                      setDomainName("");
                    })
                  }
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreateRepo}
        onDismiss={() => setShowCreateRepo(false)}
        header="Create repository"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Domain name">
              <Input value={repoDomain} onChange={({ detail }) => setRepoDomain(detail.value)} />
            </FormField>
            <FormField label="Repository name">
              <Input value={repoName} onChange={({ detail }) => setRepoName(detail.value)} />
            </FormField>
            <FormField label="Upstream repositories (comma-separated)">
              <Input value={repoUpstreams} onChange={({ detail }) => setRepoUpstreams(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateRepo(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!repoDomain || !repoName}
                  loading={createRepository.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createRepository.mutateAsync({
                          domain: repoDomain,
                          name: repoName,
                          upstreams: parseUpstreams(repoUpstreams),
                        }),
                      `Repository ${repoName} created.`
                    ).then(() => {
                      setShowCreateRepo(false);
                      setRepoDomain("");
                      setRepoName("");
                      setRepoUpstreams("");
                    })
                  }
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={token !== null}
        onDismiss={() => setToken(null)}
        header="Authorization token"
      >
        <SpaceBetween size="m">
          <CopyToClipboard
            copyButtonAriaLabel="Copy token"
            copyErrorText="Token failed to copy"
            copySuccessText="Token copied."
            textToCopy={token?.value || ""}
          />
          <Box>Expires (epoch seconds): {token?.expiration}</Box>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={endpoint !== null}
        onDismiss={() => setEndpoint(null)}
        header={`Repository endpoint (${endpoint?.repo})`}
      >
        <SpaceBetween size="m">
          <Box>{endpoint?.url}</Box>
          <CopyToClipboard
            copyButtonAriaLabel="Copy endpoint"
            copyErrorText="Endpoint failed to copy"
            copySuccessText="Endpoint copied."
            textToCopy={endpoint?.url || ""}
          />
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}
