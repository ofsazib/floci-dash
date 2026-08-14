import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ContentLayout,
  Header,
  Box,
  BreadcrumbGroup,
  SpaceBetween,
  Table,
  Button,
  Modal,
  Form,
  FormField,
  Input,
  Select,
  TextFilter,
  StatusIndicator,
  Spinner,
  Alert,
  Tabs,
  ColumnLayout,
  Container,
  FileUpload,
} from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import StatusBadge from "../components/StatusBadge";
import { DetailSkeleton } from "../components/LoadingSkeleton";
import {
  useS3Buckets,
  useS3Objects,
  useS3ObjectDetail,
  useS3CreateBucket,
  useS3DeleteBucket,
  useS3UploadFiles,
  useS3DeleteObject,
  useS3CreateFolder,
  useS3BatchDeleteObjects,
  useS3DeleteFolder,
  type S3UploadResult,
} from "../hooks/useS3";
import {
  useS3ObjectTags,
  useS3UpdateObjectTags,
  useS3ObjectAcl,
  useS3PutObjectAcl,
  useS3ObjectAttributes,
  type S3Tag,
} from "../hooks/useS3Config";
import { useS3Select } from "../hooks/useS3Select";
import StatCard from "../components/StatCard";
import S3BucketConfig from "../components/S3BucketConfig";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { formatBytes } from "../lib/utils";

export default function S3Page() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: health } = useHealth();
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const selectedBucket = searchParams.get("bucket");
  const selectedObject = searchParams.get("object");
  const [activeTab, setActiveTab] = useState(selectedBucket ? "objects" : "buckets");
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [showUploadObject, setShowUploadObject] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPrefix, setUploadPrefix] = useState("");
  const [uploadResults, setUploadResults] = useState<S3UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  function selectBucket(name: string | null) {
    if (name) {
      setSearchParams({ bucket: name });
      setActiveTab("objects");
    } else {
      setSearchParams({});
      setActiveTab("buckets");
    }
  }

  function selectObject(key: string | null) {
    // selectObject is only invoked from the objects view, where a bucket is always selected,
    // so no guard is needed here
    setSearchParams(key ? { bucket: selectedBucket!, object: key } : { bucket: selectedBucket! });
  }

  const createBucket = useS3CreateBucket();
  const uploadFilesMutation = useS3UploadFiles(selectedBucket || "");

  function closeUpload() {
    if (isUploading) return;
    setShowUploadObject(false);
    setUploadFiles([]);
    setUploadPrefix("");
    setUploadResults([]);
    setIsCompleting(false);
  }

  async function handleUpload() {
    // The Upload button is disabled until files are selected and the modal only
    // opens with a bucket selected, so no guard is needed here.
    setIsUploading(true);
    setUploadResults([]);
    try {
      const response = await uploadFilesMutation.mutateAsync({
        files: uploadFiles,
        prefix: uploadPrefix,
      });
      setUploadResults(response.results);
      if (response.failed === 0) {
        setIsCompleting(true);
        setTimeout(() => {
          setShowUploadObject(false);
          setUploadFiles([]);
          setUploadPrefix("");
          setUploadResults([]);
          setIsCompleting(false);
        }, 1200);
      }
    } catch (err) {
      setUploadResults([
        { key: "—", size: 0, status: "error", error: (err as Error).message },
      ]);
    } finally {
      setIsUploading(false);
    }
  }

  const s3Status = (health?.services["s3"] || "available") as "running" | "available";

  const tabs = selectedBucket
    ? [
        {
          label: "Objects",
          id: "objects",
          content: (
            <S3ObjectBrowser
              bucket={selectedBucket}
              selectedObject={selectedObject}
              onSelectObject={selectObject}
              onBack={() => selectBucket(null)}
              onUploadClick={() => { setUploadPrefix(""); setShowUploadObject(true); }}
            />
          ),
        },
        {
          label: "Configuration",
          id: "config",
          content: <S3BucketConfig bucket={selectedBucket} />,
        },
        {
          label: "S3 Select",
          id: "select",
          content: <S3SelectQueryEditor bucket={selectedBucket} />,
        },
      ]
    : [
        {
          label: "Buckets",
          id: "buckets",
          content: (
            <S3BucketList
              onSelectBucket={(name) => selectBucket(name)}
              onCreateClick={() => setShowCreateBucket(true)}
            />
          ),
        },
        { label: "Overview", id: "overview", content: <S3Overview /> },
      ];

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "Dashboard", href: "/#/" },
              ...(selectedBucket
                ? [
                    { text: "S3", href: "/#/services/s3" },
                    { text: selectedBucket, href: `/#/services/s3?bucket=${encodeURIComponent(selectedBucket)}` },
                  ]
                : [{ text: "S3", href: "/#/services/s3" }]),
            ]}
            onFollow={(e) => {
              e.preventDefault();
              const path = e.detail.href.replace("/#", "");
              if (path === "/services/s3") {
                selectBucket(null);
              } else {
                navigate(path);
              }
            }}
          />
          <Header
            variant="h1"
            description="Scalable object storage in the cloud"
            info={<StatusBadge status={s3Status} />}
          >
            S3
          </Header>
        </SpaceBetween>
      }
    >
      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={tabs}
      />

      <Modal
        visible={showCreateBucket}
        onDismiss={() => { setShowCreateBucket(false); setNewBucketName(""); }}
        header="Create Bucket"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => { setShowCreateBucket(false); setNewBucketName(""); }}>Cancel</Button>
              <Button
                variant="primary"
                loading={createBucket.isPending}
                onClick={() => {
                  if (newBucketName) {
                    createBucket.mutate(newBucketName, {
                      onSuccess: () => {
                        setShowCreateBucket(false);
                        setNewBucketName("");
                        showToast("success", `Bucket "${newBucketName}" created`);
                      },
                      onError: (err) => showToast("error", err.message),
                    });
                  }
                }}
              >
                Create bucket
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createBucket.isError && (
            <Alert type="error" dismissible>{(createBucket.error as Error)?.message || "Failed to create bucket"}</Alert>
          )}
          <FormField label="Bucket name" description="Must be globally unique. Use lowercase letters, numbers, and hyphens.">
            <Input value={newBucketName} onChange={(e) => setNewBucketName(e.detail.value)} placeholder="my-bucket" />
          </FormField>
        </Form>
      </Modal>

      <Modal
        visible={showUploadObject}
        onDismiss={closeUpload}
        header={`Upload to ${selectedBucket}`}
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={closeUpload} disabled={isUploading}>Cancel</Button>
              <Button
                variant="primary"
                loading={isUploading}
                disabled={uploadFiles.length === 0 || isCompleting}
                onClick={handleUpload}
              >
                {uploadFiles.length > 0
                  ? `Upload ${uploadFiles.length} file${uploadFiles.length === 1 ? "" : "s"}`
                  : "Upload"}
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {uploadFilesMutation.isError && (
            <Alert type="error" dismissible>
              {(uploadFilesMutation.error as Error)?.message || "Failed to upload"}
            </Alert>
          )}
          {uploadResults.length > 0 && (
            <Alert
              type={uploadResults.some((r) => r.status === "error") ? "warning" : "success"}
              dismissible
              onDismiss={() => setUploadResults([])}
            >
              {uploadResults.filter((r) => r.status === "uploaded").length} of {uploadResults.length} files uploaded
            </Alert>
          )}
          <FormField
            label="Files"
            description="Browse to select one or more files. Drag and drop is supported."
            constraintText={`Max 50 MB per file (override backend with S3_MAX_UPLOAD_BYTES)`}
          >
            <FileUpload
              multiple
              value={uploadFiles}
              onChange={({ detail }) => {
                setUploadFiles(detail.value);
                setUploadResults([]);
              }}
              showFileSize
              showFileLastModified
              i18nStrings={{
                // The FileUpload is always rendered with multiple=true, so the
                // single-file variants of these callbacks are unreachable.
                uploadButtonText: () => "Choose files",
                dropzoneText: () => "Drag and drop files here, or click 'Choose files'",
                removeFileAriaLabel: (fileIndex: number, fileName: string) => `Remove file ${fileName}`,
                limitShowFewer: "Show fewer files",
                limitShowMore: "Show more files",
                errorIconAriaLabel: "Error",
              }}
            />
          </FormField>
          <FormField
            label="Key prefix (optional)"
            description="Folder path to upload under, e.g. 'images/' or 'docs/2024/'. Leave empty to upload to the bucket root."
          >
            <Input
              value={uploadPrefix}
              onChange={(e) => setUploadPrefix(e.detail.value)}
              placeholder="folder/subfolder/"
            />
          </FormField>
          {uploadResults.length > 0 && (
            <Container header={<Header variant="h3">Upload results</Header>}>
              <SpaceBetween size="xs">
                {uploadResults.map((r, i) => (
                  <div
                    key={`${r.key}-${i}`}
                    className={`fd-upload-${r.status === "uploaded" ? "success" : "error"}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 10px",
                      borderRadius: 6,
                    }}
                  >
                    <StatusIndicator type={r.status === "uploaded" ? "success" : "error"}>
                      {r.status === "uploaded" ? "Uploaded" : "Failed"}
                    </StatusIndicator>
                    <code style={{ fontSize: 13, flex: 1, wordBreak: "break-all" }}>{r.key}</code>
                    <Box variant="small" color="text-body-secondary">
                      {formatBytes(r.size)}
                    </Box>
                    {r.error && (
                      <Box variant="small" color="text-status-error">
                        {r.error}
                      </Box>
                    )}
                  </div>
                ))}
              </SpaceBetween>
            </Container>
          )}
        </Form>
      </Modal>
    </ContentLayout>
  );
}

function S3Overview() {
  const { data } = useS3Buckets();
  const bucketCount = data?.total ?? 0;

  return (
    <Box padding={{ top: "l" }}>
      <ColumnLayout columns={3} variant="text-grid">
        <div className="fd-accent-card">
          <Box variant="small" color="text-body-secondary">Buckets</Box>
          <Box variant="h1" padding={{ top: "xxs" }}>
            <span className="fd-accent-info">{bucketCount}</span>
          </Box>
        </div>
        <div className="fd-accent-card">
          <Box variant="small" color="text-body-secondary">Status</Box>
          <Box variant="h4" padding={{ top: "xxs" }}>
            <StatusIndicator type="success">Active</StatusIndicator>
          </Box>
        </div>
        <div className="fd-accent-card">
          <Box variant="small" color="text-body-secondary">Region</Box>
          <Box variant="p" padding={{ top: "xxs" }}>
            <span className="fd-accent-purple">us-east-1</span>
          </Box>
        </div>
      </ColumnLayout>
    </Box>
  );
}

function S3BucketList({ onSelectBucket, onCreateClick }: { onSelectBucket: (name: string) => void; onCreateClick: () => void }) {
  const { data, isLoading, isError, error } = useS3Buckets();
  const deleteBucket = useS3DeleteBucket();
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBuckets = (data?.buckets || []).filter(
    (b) => !searchTerm || b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Table
        variant="full-page"
        header={
          <Header variant="h2" counter={`(${data?.total ?? 0})`} actions={<Button variant="primary" onClick={onCreateClick}>Create bucket</Button>}>
            Buckets
          </Header>
        }
      filter={
        <TextFilter
          filteringPlaceholder="Find buckets by name"
          filteringText={searchTerm}
          onChange={({ detail }) => setSearchTerm(detail.filteringText)}
          countText={`${filteredBuckets.length} match${filteredBuckets.length === 1 ? "" : "es"}`}
        />
      }
      columnDefinitions={[
        { id: "name", header: "Name", cell: (item: any) => <Button variant="link" onClick={() => onSelectBucket(item.name)}>{item.name}</Button>, isRowHeader: true, width: 400 },
        { id: "created", header: "Created", cell: (item: any) => item.createdAt ? new Date(item.createdAt).toLocaleString() : "—" },
        { id: "actions", header: "", width: 80, cell: (item: any) => (
          <Button variant="icon" iconName="remove" ariaLabel={`Delete ${item.name}`} loading={deleteBucket.isPending && deleteBucket.variables === item.name}
            onClick={async () => {
              const ok = await confirm({ title: "Delete bucket", message: `Permanently delete bucket "${item.name}"?`, confirmText: "Delete", variant: "danger" });
              if (ok) deleteBucket.mutate(item.name, {
                onSuccess: () => showToast("success", `Bucket "${item.name}" deleted`),
                onError: (err) => showToast("error", err.message),
              });
            }} />
        )},
      ]}
      items={filteredBuckets}
      loading={isLoading}
      loadingText="Loading buckets..."
      empty={
        isError ? (
          <Box textAlign="center" padding={{ top: "xl" }}><StatusIndicator type="error">{(error as Error)?.message || "Failed to load buckets"}</StatusIndicator></Box>
        ) : searchTerm ? (
          <Box textAlign="center" padding={{ top: "xxl", bottom: "xxl" }}>
            <Box variant="h3" padding={{ bottom: "s" }}>No matches</Box>
            <Box variant="p" color="text-body-secondary">No buckets match "{searchTerm}". Try a different search term.</Box>
          </Box>
        ) : (
          <Box textAlign="center" padding={{ top: "xxl", bottom: "xxl" }}>
            <Box variant="h3" padding={{ bottom: "s" }}>No buckets</Box>
            <Box variant="p" color="text-body-secondary" padding={{ bottom: "l" }}>Create your first bucket to start storing objects in S3.</Box>
            <Button variant="primary" onClick={onCreateClick}>Create bucket</Button>
          </Box>
        )
      }
    />
      {dialog}
    </>
  );
}

function S3ObjectBrowser({ bucket, selectedObject, onSelectObject, onBack, onUploadClick }: {
  bucket: string; selectedObject: string | null; onSelectObject: (key: string | null) => void; onBack: () => void; onUploadClick: () => void;
}) {
  const [prefix, setPrefix] = useState("");
  const { data, isLoading } = useS3Objects(bucket, prefix);
  const deleteObject = useS3DeleteObject(bucket);
  const createFolder = useS3CreateFolder(bucket);
  const batchDeleteObjects = useS3BatchDeleteObjects(bucket);
  const deleteFolder = useS3DeleteFolder(bucket);
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [searchTerm, setSearchTerm] = useState("");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const folders = data?.folders || [];
  const allObjects = data?.objects || [];
  const filteredObjects = searchTerm
    ? allObjects.filter((o) => o.key.toLowerCase().includes(searchTerm.toLowerCase()))
    : allObjects;

  function navigateToFolder(folderPrefix: string) {
    setPrefix(folderPrefix);
    setSearchTerm("");
  }

  function navigateUp() {
    const parts = prefix.replace(/\/$/, "").split("/");
    parts.pop();
    const parent = parts.length > 0 ? parts.join("/") + "/" : "";
    setPrefix(parent);
    setSearchTerm("");
  }

  const breadcrumbItems: Array<{ text: string; href: string; prefix?: string }> = [
    { text: bucket, href: "#" },
    ...prefix
      .replace(/\/$/, "")
      .split("/")
      .filter(Boolean)
      .map((part, i, arr) => ({
        text: part,
        href: "#",
        prefix: arr.slice(0, i + 1).join("/") + "/",
      })),
  ];

  if (selectedObject) return <S3ObjectViewer bucket={bucket} objectKey={selectedObject} onBack={() => onSelectObject(null)} />;

  const totalCount = folders.length + filteredObjects.length;

  return (
    <>
      <Table
        variant="full-page"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        selectionType="multi"
        trackBy="key"
        resizableColumns
        header={
          <Header
            variant="h2"
            counter={`(${totalCount})`}
            description={bucket}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                {selectedItems.length > 0 && (
                  <Button
                    variant="primary"
                    iconName="remove"
                    loading={batchDeleteObjects.isPending}
                    onClick={async () => {
                      const keys = selectedItems.map((i) => i.key);
                      const ok = await confirm({
                        title: `Delete ${keys.length} object${keys.length === 1 ? "" : "s"}`,
                        message: `Permanently delete ${keys.length} object${keys.length === 1 ? "" : "s"} from bucket "${bucket}"?`,
                        confirmText: "Delete",
                        variant: "danger",
                      });
                      if (ok) {
                        batchDeleteObjects.mutate(keys, {
                          onSuccess: (data: any) => {
                            const deleted = data.deleted?.length || keys.length;
                            const errors = data.errors?.length || 0;
                            if (errors > 0) {
                              showToast("warning", `${deleted} deleted, ${errors} failed`);
                            } else {
                              showToast("success", `${deleted} object${deleted === 1 ? "" : "s"} deleted`);
                            }
                            setSelectedItems([]);
                          },
                          onError: (err) => showToast("error", err.message),
                        });
                      }
                    }}
                  >
                    Delete selected ({selectedItems.length})
                  </Button>
                )}
                <Button variant="normal" onClick={onBack}>← Buckets</Button>
                <Button variant="normal" onClick={() => setCreateFolderOpen(true)}>Create folder</Button>
                <Button variant="primary" onClick={onUploadClick}>Upload</Button>
              </SpaceBetween>
            }
          >
            {prefix ? (
              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Button variant="link" iconName="arrow-left" onClick={navigateUp}>
                  Back
                </Button>
                <span style={{ fontSize: "0.85em" }}>
                  {breadcrumbItems.map((item, i) => (
                    <span key={i}>
                      {i > 0 && <span style={{ margin: "0 4px" }} className="fd-text-muted">/</span>}
                      {item.prefix != null ? (
                        <Button variant="link" onClick={() => navigateToFolder(item.prefix!)}>
                          {item.text}
                        </Button>
                      ) : (
                        // Only the first crumb (the bucket) lacks a prefix, so i is always 0 here
                        <span style={{ fontWeight: 600 }}>{item.text}</span>
                      )}
                    </span>
                  ))}
                </span>
              </SpaceBetween>
            ) : (
              "Objects"
            )}
          </Header>
        }
        filter={
          <TextFilter
            filteringPlaceholder="Filter by name"
            filteringText={searchTerm}
            onChange={({ detail }) => setSearchTerm(detail.filteringText)}
            countText={`${totalCount} item${totalCount === 1 ? "" : "s"}`}
          />
        }
        columnDefinitions={[
          {
            id: "name", header: "Name", isRowHeader: true, width: 500,
            cell: (item: any) => {
              if (item._isFolder) {
                return (
                  <Button variant="link" iconName="folder" onClick={() => navigateToFolder(item._folderPrefix)}>
                    {item._folderName}/
                  </Button>
                );
              }
              const displayName = prefix ? item.key.replace(prefix, "") : item.key;
              return (
                <Button variant="link" onClick={() => onSelectObject(item.key)}>
                  {displayName}
                </Button>
              );
            },
          },
          { id: "size", header: "Size", cell: (item: any) => item._isFolder ? "—" : formatBytes(item.size) },
          { id: "modified", header: "Last modified", cell: (item: any) => item._isFolder ? "—" : (item.lastModified ? new Date(item.lastModified).toLocaleString() : "—") },
          { id: "actions", header: "", width: 80, cell: (item: any) => {
            if (item._isFolder) {
              return (
                <Button
                  variant="icon"
                  iconName="remove"
                  ariaLabel={`Delete folder ${item._folderName}`}
                  loading={deleteFolder.isPending && deleteFolder.variables === item._folderPrefix}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete folder",
                      message: `Permanently delete folder "${item._folderName}" and all its contents from bucket "${bucket}"?`,
                      confirmText: "Delete",
                      variant: "danger",
                    });
                    if (ok) {
                      deleteFolder.mutate(item._folderPrefix, {
                        onSuccess: (data: any) => {
                          const n = data.totalDeleted || 0;
                          showToast("success", `Folder "${item._folderName}" deleted (${n} object${n === 1 ? "" : "s"})`);
                        },
                        onError: (err) => showToast("error", err.message),
                      });
                    }
                  }}
                />
              );
            }
            return (
              <Button
                variant="icon"
                iconName="remove"
                ariaLabel={`Delete ${item.key}`}
                loading={deleteObject.isPending && deleteObject.variables === item.key}
                onClick={async () => {
                  const ok = await confirm({ title: "Delete object", message: `Delete "${item.key}" from bucket "${bucket}"?`, confirmText: "Delete", variant: "danger" });
                  if (ok) deleteObject.mutate(item.key, {
                    onSuccess: () => showToast("success", `Object "${item.key}" deleted`),
                    onError: (err) => showToast("error", err.message),
                  });
                }}
              />
            );
          }},
        ]}
        items={[
          ...folders.map((f) => ({ _isFolder: true, _folderPrefix: f.prefix, _folderName: f.name, key: f.prefix })),
          ...filteredObjects,
        ]}
        loading={isLoading}
        loadingText="Loading objects..."
        empty={
          prefix ? (
            <Box textAlign="center" padding={{ top: "xxl", bottom: "xxl" }}>
              <Box variant="h3" padding={{ bottom: "s" }}>Empty folder</Box>
              <Box variant="p" color="text-body-secondary" padding={{ bottom: "l" }}>This folder is empty. Upload an object or go back.</Box>
              <Box textAlign="center">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={navigateUp}>← Back</Button>
                  <Button variant="primary" onClick={onUploadClick}>Upload object</Button>
                </SpaceBetween>
              </Box>
            </Box>
          ) : searchTerm ? (
            <Box textAlign="center" padding={{ top: "xxl", bottom: "xxl" }}>
              <Box variant="h3" padding={{ bottom: "s" }}>No matches</Box>
              <Box variant="p" color="text-body-secondary">No objects match "{searchTerm}". Try a different search term.</Box>
            </Box>
          ) : (
            <Box textAlign="center" padding={{ top: "xxl", bottom: "xxl" }}>
              <Box variant="h3" padding={{ bottom: "s" }}>No objects</Box>
              <Box variant="p" color="text-body-secondary" padding={{ bottom: "l" }}>This bucket is empty. Upload your first object.</Box>
              <Button variant="primary" onClick={onUploadClick}>Upload object</Button>
            </Box>
          )
        }
      />
      {dialog}
      <Modal
        visible={createFolderOpen}
        onDismiss={() => { setCreateFolderOpen(false); setNewFolderName(""); }}
        header="Create folder"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => { setCreateFolderOpen(false); setNewFolderName(""); }}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!newFolderName.trim()}
              loading={createFolder.isPending}
              onClick={() => {
                const folderPrefix = `${prefix}${newFolderName.trim()}/`;
                createFolder.mutate(folderPrefix, {
                  onSuccess: () => {
                    showToast("success", `Folder "${newFolderName.trim()}" created`);
                    setCreateFolderOpen(false);
                    setNewFolderName("");
                  },
                  onError: (err) => showToast("error", err.message),
                });
              }}
            >
              Create
            </Button>
          </SpaceBetween>
        }
      >
        <Form>
          <FormField label="Folder name">
            <Input
              value={newFolderName}
              onChange={({ detail }) => setNewFolderName(detail.value)}
              placeholder="e.g. logs/2024"
              autoFocus
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

function S3ObjectViewer({ bucket, objectKey, onBack }: { bucket: string; objectKey: string; onBack: () => void }) {
  const { data, isLoading, isError, error } = useS3ObjectDetail(bucket, objectKey);
  const { data: objectTags } = useS3ObjectTags(bucket, objectKey);
  const updateObjectTags = useS3UpdateObjectTags(bucket, objectKey);
  const { showToast } = useToast();
  const [editingTags, setEditingTags] = useState(false);
  const [tagPairs, setTagPairs] = useState<Array<{ key: string; value: string }>>([]);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [textPreviewError, setTextPreviewError] = useState(false);

  const rawUrl = `/api/aws/s3/buckets/${bucket}/objects/${encodeURIComponent(objectKey)}/raw`;
  const s3Uri = `s3://${bucket}/${objectKey}`;
  const fileName = objectKey.split("/").pop() || objectKey;
  const contentType = data?.contentType || "";
  const isImage = /^image\//.test(contentType);
  const isVideo = /^video\//.test(contentType);
  const isAudio = /^audio\//.test(contentType);
  const isPdf = contentType === "application/pdf";
  const isText = /^text\//.test(contentType) || contentType === "application/json" || contentType === "application/javascript" || contentType === "application/xml";

  useEffect(() => {
    if (isText && data) {
      setTextPreview(null);
      setTextPreviewError(false);
      fetch(rawUrl)
        .then((r) => r.text())
        .then(setTextPreview)
        .catch(() => setTextPreviewError(true));
    }
  }, [rawUrl, isText, data]);

  if (isLoading) return <DetailSkeleton />;
  if (isError) return (
    <Box padding={{ top: "l" }}>
      <Button variant="link" onClick={onBack}>← Back</Button>
      <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>
    </Box>
  );

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = rawUrl;
    a.download = fileName;
    a.click();
  };

  return (
    <SpaceBetween size="l">
      <SpaceBetween size="xs">
        <Button variant="link" onClick={onBack}>← Objects</Button>
        <Box variant="h2">{objectKey}</Box>
      </SpaceBetween>

      <ColumnLayout columns={4} variant="text-grid">
        <StatCard label="Size" value={data?.size != null ? formatBytes(data.size) : "—"} variant="info" size="sm" />
        <StatCard label="Type" value={data?.contentType || "—"} variant="info" size="sm" />
        <StatCard label="Modified" value={data?.lastModified ? new Date(data.lastModified).toLocaleString() : "—"} variant="info" size="sm" />
        <StatCard label="ETag" value={data?.etag || "—"} variant="info" size="sm" />
      </ColumnLayout>

      <Container header={<Header variant="h3">Actions</Header>}>
        <SpaceBetween size="s">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Box variant="small" color="text-body-secondary" padding={{ right: "s" }}>S3 URI:</Box>
            <code style={{ fontSize: 13 }}>{s3Uri}</code>
            <Button variant="icon" iconName="copy" ariaLabel="Copy S3 URI" onClick={async () => { await navigator.clipboard.writeText(s3Uri); showToast("info", "S3 URI copied"); }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="primary" iconName="external" href={rawUrl} target="_blank" rel="noreferrer">Open in browser</Button>
            <Button variant="normal" iconName="download" onClick={handleDownload}>Download</Button>
          </div>
        </SpaceBetween>
      </Container>

      {/* Object Tags */}
      <Container
        header={
          <Header
            variant="h3"
            actions={
              <Button
                variant={editingTags ? "normal" : "link"}
                onClick={() => {
                  if (editingTags) {
                    setEditingTags(false);
                  } else {
                    setTagPairs((objectTags?.tags || []).map((t) => ({ key: t.Key, value: t.Value })));
                    setEditingTags(true);
                  }
                }}
              >
                {editingTags ? "Cancel" : "Edit tags"}
              </Button>
            }
          >
            Object Tags ({objectTags?.total || 0})
          </Header>
        }
      >
        {editingTags ? (
          <SpaceBetween size="s">
            {tagPairs.map((tag, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    value={tag.key}
                    onChange={({ detail }) => setTagPairs((prev) => prev.map((t, idx) => idx === i ? { ...t, key: detail.value } : t))}
                    placeholder="Key"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    value={tag.value}
                    onChange={({ detail }) => setTagPairs((prev) => prev.map((t, idx) => idx === i ? { ...t, value: detail.value } : t))}
                    placeholder="Value"
                  />
                </div>
                <Button variant="icon" iconName="remove" ariaLabel={`Remove tag ${tag.key || i + 1}`} onClick={() => setTagPairs((prev) => prev.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="normal" iconName="add-plus" onClick={() => setTagPairs((prev) => [...prev, { key: "", value: "" }])}>Add tag</Button>
              <Button
                variant="primary"
                loading={updateObjectTags.isPending}
                onClick={() => {
                  const validTags = tagPairs.filter((t) => t.key && t.value).map((t) => ({ Key: t.key, Value: t.value }));
                  updateObjectTags.mutate(validTags, {
                    onSuccess: () => {
                      setEditingTags(false);
                      showToast("success", "Tags updated");
                    },
                    onError: (err) => showToast("error", err.message),
                  });
                }}
              >
                Save tags
              </Button>
            </div>
          </SpaceBetween>
        ) : (objectTags?.tags?.length ?? 0) > 0 ? (
          <SpaceBetween size="xs">
            {objectTags!.tags.map((t) => (
              <div key={t.Key} className="fd-tag-chip">
                <code style={{ fontWeight: 600 }}>{t.Key}</code>
                <span>=</span>
                <code>{t.Value}</code>
              </div>
            ))}
          </SpaceBetween>
        ) : (
          <Box color="text-body-secondary">No tags set on this object.</Box>
        )}
      </Container>

      {/* Object ACL */}
      <ObjectAclView bucket={bucket} objectKey={objectKey} />

      {/* Object Checksums */}
      <ObjectChecksumView bucket={bucket} objectKey={objectKey} />

      {/* Preview */}
      <Container header={<Header variant="h3">Preview</Header>}>
        {isImage ? (
          <div style={{ textAlign: "center" }}>
            <img src={rawUrl} alt={fileName} style={{ maxWidth: "100%", height: "auto", borderRadius: 8 }} />
          </div>
        ) : isVideo ? (
          <div style={{ textAlign: "center" }}>
            <video controls style={{ maxWidth: "100%", borderRadius: 8 }} src={rawUrl} />
          </div>
        ) : isAudio ? (
          <div style={{ padding: "20px 0" }}>
            <audio controls style={{ width: "100%" }} src={rawUrl} />
          </div>
        ) : isPdf ? (
          <div style={{ textAlign: "center" }}>
            <iframe src={rawUrl} title={fileName} style={{ width: "100%", height: "600px", border: "none", borderRadius: 8 }} />
          </div>
        ) : isText ? (
          textPreviewError ? (
            <StatusIndicator type="error">Failed to load text content</StatusIndicator>
          ) : textPreview === null ? (
            <Spinner />
          ) : (
            <Box variant="code">
              <pre className="fd-code-block">
                {textPreview}
              </pre>
            </Box>
          )
        ) : (
          <Box color="text-body-secondary" padding={{ top: "m", bottom: "m" }}>
            Preview not available for this file type ({contentType || "unknown"}).
            Use <strong>Open in browser</strong> or <strong>Download</strong> above.
          </Box>
        )}
      </Container>
    </SpaceBetween>
  );
}

// ─── Object ACL View ────────────────────────────────────────

const OBJ_CANNED_ACL_OPTIONS = [
  { label: "private — Owner gets FULL_CONTROL", value: "private" },
  { label: "public-read — Owner gets FULL_CONTROL, AllUsers get READ", value: "public-read" },
  { label: "public-read-write — Owner gets FULL_CONTROL, AllUsers get READ+WRITE", value: "public-read-write" },
  { label: "authenticated-read — Owner gets FULL_CONTROL, authenticated users get READ", value: "authenticated-read" },
  { label: "bucket-owner-read — Object owner gets FULL_CONTROL, bucket owner gets READ", value: "bucket-owner-read" },
  { label: "bucket-owner-full-control — Object owner + bucket owner get FULL_CONTROL", value: "bucket-owner-full-control" },
];

function ObjectAclView({ bucket, objectKey }: { bucket: string; objectKey: string }) {
  const { data, isLoading } = useS3ObjectAcl(bucket, objectKey);
  const updateAcl = useS3PutObjectAcl(bucket, objectKey);
  const { showToast } = useToast();
  const [showSetAcl, setShowSetAcl] = useState(false);
  const [selectedAcl, setSelectedAcl] = useState(OBJ_CANNED_ACL_OPTIONS[0].value);

  const granteeLabel = (g: any) => {
    if (!g) return "Unknown";
    if (g.uri?.includes("AllUsers")) return "Everyone (AllUsers)";
    if (g.uri?.includes("AuthenticatedUsers")) return "Authenticated Users";
    if (g.uri?.includes("LogDelivery")) return "Log Delivery";
    if (g.displayName) return g.displayName;
    if (g.id) return `ID: ${g.id}`;
    if (g.emailAddress) return g.emailAddress;
    return g.type || "Unknown";
  };

  return (
    <Container
      header={
        <Header
          variant="h3"
          counter={data ? `(${data.totalGrants})` : undefined}
          actions={
            <Button variant="normal" onClick={() => setShowSetAcl(!showSetAcl)}>
              {showSetAcl ? "Cancel" : "Set ACL"}
            </Button>
          }
        >
          Object ACL
        </Header>
      }
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <SpaceBetween size="m">
          {data?.owner && (
            <Box variant="p">
              <strong>Owner:</strong> {data.owner.displayName} (ID: {data.owner.id})
            </Box>
          )}
          {(data?.grants?.length ?? 0) > 0 ? (
            <Table
              columnDefinitions={[
                { id: "grantee", header: "Grantee", cell: (item: any) => granteeLabel(item.grantee) },
                { id: "type", header: "Type", cell: (item: any) => item.grantee?.type || "—" },
                {
                  id: "permission",
                  header: "Permission",
                  cell: (item: any) => (
                    <StatusIndicator type={item.permission === "FULL_CONTROL" ? "success" : "info"}>
                      {item.permission}
                    </StatusIndicator>
                  ),
                },
              ]}
              items={data!.grants}
            />
          ) : (
            <Box color="text-body-secondary">No grants configured for this object.</Box>
          )}

          {showSetAcl && (
            <SpaceBetween size="s">
              <Box variant="p" color="text-body-secondary">
                Override all grants with a canned ACL.
              </Box>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <FormField label="Canned ACL">
                  {/* selectedAcl is initialized from the options and only ever set from onChange, so the find always succeeds */}
                  <Select
                    selectedOption={OBJ_CANNED_ACL_OPTIONS.find((o) => o.value === selectedAcl)!}
                    onChange={({ detail }) => setSelectedAcl((detail.selectedOption as any).value as string)}
                    options={OBJ_CANNED_ACL_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  />
                </FormField>
                <Button
                  variant="primary"
                  loading={updateAcl.isPending}
                  onClick={() =>
                    updateAcl.mutate(
                      { cannedAcl: selectedAcl },
                      {
                        onSuccess: () => {
                          showToast("success", "Object ACL updated");
                          setShowSetAcl(false);
                        },
                        onError: (err) => showToast("error", err.message),
                      }
                    )
                  }
                >
                  Apply
                </Button>
              </div>
              {updateAcl.isError && (
                <Alert type="error" dismissible>
                  {(updateAcl.error as Error)?.message || "Failed to update ACL"}
                </Alert>
              )}
            </SpaceBetween>
          )}
        </SpaceBetween>
      )}
    </Container>
  );
}

// ─── Object Checksum View ───────────────────────────────────

const CHECKSUM_ALGORITHMS = [
  { key: "ChecksumCRC32", label: "CRC32" },
  { key: "ChecksumCRC32C", label: "CRC32C" },
  { key: "ChecksumSHA1", label: "SHA-1" },
  { key: "ChecksumSHA256", label: "SHA-256" },
  { key: "ChecksumCRC64NVME", label: "CRC64-NVME" },
] as const;

function ObjectChecksumView({ bucket, objectKey }: { bucket: string; objectKey: string }) {
  const { data, isLoading } = useS3ObjectAttributes(bucket, objectKey);
  const { showToast } = useToast();
  const [verifyAlgo, setVerifyAlgo] = useState("ChecksumSHA256");
  const [verifyValue, setVerifyValue] = useState("");
  const [matchResult, setMatchResult] = useState<boolean | null>(null);

  const checksum = data?.checksum;
  const hasAnyChecksum = checksum && CHECKSUM_ALGORITHMS.some((a) => checksum[a.key]);

  function handleVerify() {
    // The Verify button is disabled while the input is empty and this view only
    // renders when checksum data exists, so no early-return guard is needed.
    const stored = checksum![verifyAlgo as keyof typeof checksum];
    if (!stored) {
      setMatchResult(null);
      return;
    }
    setMatchResult(stored.trim() === verifyValue.trim());
  }

  return (
    <Container
      header={
        <Header variant="h3">
          Checksums {checksum?.ChecksumType ? `(${checksum.ChecksumType})` : ""}
        </Header>
      }
    >
      {isLoading ? (
        <Spinner />
      ) : hasAnyChecksum ? (
        <SpaceBetween size="m">
          {/* Checksum values */}
          <Table
            header={<Header variant="h3">Stored Checksums</Header>}
            columnDefinitions={[
              {
                id: "algorithm",
                header: "Algorithm",
                cell: (item: any) => item.label,
                width: 180,
              },
              {
                id: "value",
                header: "Value (base64)",
                cell: (item: any) => (
                  // rows are pre-filtered to algorithms with a stored checksum, so the value is always present
                  <code style={{ fontSize: 12, wordBreak: "break-all" }}>
                    {/* rows are pre-filtered to algorithms with a stored checksum */}
                    {checksum![item.key]!}
                  </code>
                ),
              },
              {
                id: "copy",
                header: "",
                width: 60,
                cell: (item: any) => (
                  <Button
                    variant="icon"
                    iconName="copy"
                    ariaLabel={`Copy ${item.label}`}
                    onClick={async () => {
                      await navigator.clipboard.writeText(checksum![item.key]!);
                      showToast("info", `${item.label} copied`);
                    }}
                  />
                ),
              },
            ]}
            items={CHECKSUM_ALGORITHMS.filter(
              (a) => checksum![a.key]
            )}
          />

          {/* Verify checksum */}
          <Container header={<Header variant="h3">Verify Checksum</Header>}>
            <SpaceBetween size="s">
              <Box variant="p" color="text-body-secondary">
                Paste a checksum value to verify it matches the stored value for this object.
              </Box>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <FormField label="Algorithm">
                  <Select
                    selectedOption={
                      CHECKSUM_ALGORITHMS
                        .filter((a) => checksum![a.key])
                        .map((a) => ({ label: a.label, value: a.key }))
                        .find((o) => o.value === verifyAlgo) || {
                        label: "SHA-256",
                        value: "ChecksumSHA256",
                      }
                    }
                    onChange={({ detail }) => {
                      setVerifyAlgo((detail.selectedOption as any).value);
                      setMatchResult(null);
                    }}
                    options={CHECKSUM_ALGORITHMS.filter((a) => checksum![a.key]).map(
                      (a) => ({ label: a.label, value: a.key })
                    )}
                  />
                </FormField>
                <FormField label="Checksum value (base64)">
                  <Input
                    value={verifyValue}
                    onChange={({ detail }) => {
                      setVerifyValue(detail.value);
                      setMatchResult(null);
                    }}
                    placeholder="Paste base64 checksum..."
                  />
                </FormField>
                <Button
                  variant="primary"
                  disabled={!verifyValue.trim()}
                  onClick={handleVerify}
                >
                  Verify
                </Button>
              </div>
              {matchResult === true && (
                <StatusIndicator type="success">
                  Checksum matches! The values are identical.
                </StatusIndicator>
              )}
              {matchResult === false && (
                <StatusIndicator type="error">
                  Checksum does NOT match. The values are different.
                </StatusIndicator>
              )}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">
          No checksum data available for this object.
        </Box>
      )}
    </Container>
  );
}

// ─── S3 Select Query Editor ─────────────────────────────────

const EXAMPLE_QUERIES: Record<string, string> = {
  CSV: 'SELECT * FROM S3Object LIMIT 10',
  JSON: 'SELECT * FROM S3Object s LIMIT 10',
};

function S3SelectQueryEditor({ bucket }: { bucket: string }) {
  const selectMutation = useS3Select(bucket);
  const [objectKey, setObjectKey] = useState("");
  const [expression, setExpression] = useState(EXAMPLE_QUERIES.CSV);
  const [inputType, setInputType] = useState<"CSV" | "JSON">("CSV");
  const [outputFormat, setOutputFormat] = useState<"CSV" | "JSON">("CSV");
  const [fileHeaderInfo, setFileHeaderInfo] = useState<"USE" | "IGNORE" | "NONE">("NONE");
  const [result, setResult] = useState<string | null>(null);
  const [stats, setStats] = useState<{ bytesScanned: number; bytesProcessed: number; bytesReturned: number } | null>(null);

  function handleRunQuery() {
    // The Run query button is disabled while either input is empty.
    setResult(null);
    setStats(null);
    selectMutation.mutate(
      { key: objectKey.trim(), expression: expression.trim(), inputType, outputFormat, fileHeaderInfo },
      {
        onSuccess: (data) => {
          setResult(data.result);
          setStats(data.stats);
        },
      }
    );
  }

  function handleInputTypeChange(newType: "CSV" | "JSON") {
    setInputType(newType);
    if (expression === EXAMPLE_QUERIES.CSV || expression === EXAMPLE_QUERIES.JSON) {
      setExpression(EXAMPLE_QUERIES[newType]);
    }
  }

  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header
            variant="h2"
            description="Run SQL queries on CSV and JSON objects stored in S3"
            actions={
              <Button
                variant="primary"
                iconName="play"
                loading={selectMutation.isPending}
                disabled={!objectKey.trim() || !expression.trim()}
                onClick={handleRunQuery}
              >
                Run query
              </Button>
            }
          >
            S3 Select
          </Header>
        }
      >
        <SpaceBetween size="m">
          <Form>
            {selectMutation.isError && (
              <Alert type="error" dismissible>
                {(selectMutation.error as Error)?.message || "Query failed"}
              </Alert>
            )}

            <FormField
              label="Object key"
              description="The S3 object key to query (e.g. data.csv or logs/2024/events.json)"
            >
              <Input
                value={objectKey}
                onChange={({ detail }) => setObjectKey(detail.value)}
                placeholder="data.csv"
              />
            </FormField>

            <FormField
              label="SQL expression"
              description={
                <span>
                  Use <code>SELECT ... FROM S3Object</code> syntax.
                  For CSV with headers, use column names. For CSV without headers, use <code>_1</code>, <code>_2</code>, etc.
                </span>
              }
            >
              <div style={{ fontFamily: "monospace" }}>
                <textarea
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  rows={4}
                  placeholder="SELECT * FROM S3Object LIMIT 10"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
                    border: "1px solid var(--color-border-control-default, #aab7b8)",
                    borderRadius: "2px",
                    boxSizing: "border-box",
                    resize: "vertical",
                    lineHeight: 1.5,
                    outline: "none",
                    background: "var(--color-background-input-default, #fff)",
                    color: "var(--color-text-body-default, #16191f)",
                  }}
                />
              </div>
            </FormField>

            <ColumnLayout columns={3} variant="text-grid">
              <FormField label="Input format">
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    variant={inputType === "CSV" ? "primary" : "normal"}
                    onClick={() => handleInputTypeChange("CSV")}
                  >
                    CSV
                  </Button>
                  <Button
                    variant={inputType === "JSON" ? "primary" : "normal"}
                    onClick={() => handleInputTypeChange("JSON")}
                  >
                    JSON
                  </Button>
                </div>
              </FormField>

              <FormField label="Output format">
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    variant={outputFormat === "CSV" ? "primary" : "normal"}
                    onClick={() => setOutputFormat("CSV")}
                  >
                    CSV
                  </Button>
                  <Button
                    variant={outputFormat === "JSON" ? "primary" : "normal"}
                    onClick={() => setOutputFormat("JSON")}
                  >
                    JSON
                  </Button>
                </div>
              </FormField>

              {inputType === "CSV" && (
                <FormField label="Header treatment" description="How to interpret the first row">
                  <div style={{ display: "flex", gap: 4 }}>
                    <Button
                      variant={fileHeaderInfo === "NONE" ? "primary" : "normal"}
                      onClick={() => setFileHeaderInfo("NONE")}
                    >
                      None
                    </Button>
                    <Button
                      variant={fileHeaderInfo === "USE" ? "primary" : "normal"}
                      onClick={() => setFileHeaderInfo("USE")}
                    >
                      Use
                    </Button>
                    <Button
                      variant={fileHeaderInfo === "IGNORE" ? "primary" : "normal"}
                      onClick={() => setFileHeaderInfo("IGNORE")}
                    >
                      Ignore
                    </Button>
                  </div>
                </FormField>
              )}
            </ColumnLayout>
          </Form>
        </SpaceBetween>
      </Container>

      {stats && (
        <Container header={<Header variant="h3">Query statistics</Header>}>
          <ColumnLayout columns={3} variant="text-grid">
            <div className="fd-accent-card">
              <Box variant="small" color="text-body-secondary">Scanned</Box>
              <Box variant="h3" padding={{ top: "xxs" }}>
                <span className="fd-accent-info">{formatBytes(stats.bytesScanned)}</span>
              </Box>
            </div>
            <div className="fd-accent-card">
              <Box variant="small" color="text-body-secondary">Processed</Box>
              <Box variant="h3" padding={{ top: "xxs" }}>
                <span className="fd-accent-purple">{formatBytes(stats.bytesProcessed)}</span>
              </Box>
            </div>
            <div className="fd-accent-card">
              <Box variant="small" color="text-body-secondary">Returned</Box>
              <Box variant="h3" padding={{ top: "xxs" }}>
                <span className="fd-accent-success">{formatBytes(stats.bytesReturned)}</span>
              </Box>
            </div>
          </ColumnLayout>
        </Container>
      )}

      {result !== null && (
        <Container header={<Header variant="h3">Results</Header>}>
          {result ? (
            <Box variant="code">
              <pre className="fd-code-block" style={{ maxHeight: "500px", overflow: "auto" }}>
                {result}
              </pre>
            </Box>
          ) : (
            <Box color="text-body-secondary" padding={{ top: "m", bottom: "m" }}>
              Query returned no results.
            </Box>
          )}
        </Container>
      )}

      {selectMutation.isPending && (
        <Box textAlign="center" padding={{ top: "xl", bottom: "xl" }}>
          <Spinner size="large" />
          <Box variant="p" color="text-body-secondary" padding={{ top: "m" }}>
            Running query...
          </Box>
        </Box>
      )}

      {!result && !selectMutation.isPending && (
        <Container
          header={<Header variant="h3">SQL reference</Header>}
        >
          <Box variant="p" padding={{ bottom: "s" }}>
            S3 Select supports a subset of SQL. Here are some examples:
          </Box>
          <Box variant="code">
            <pre className="fd-code-block">
{`-- Select all columns, limit rows
SELECT * FROM S3Object LIMIT 100

-- Select specific columns (CSV with headers)
SELECT name, age, city FROM S3Object

-- Select with WHERE clause
SELECT * FROM S3Object WHERE age > 30

-- For CSV without headers, use _1, _2, etc.
SELECT _1, _2 FROM S3Object WHERE CAST(_3 AS INT) > 100

-- JSON: access nested fields
SELECT s.name, s.address.city FROM S3Object s

-- Aggregate functions
SELECT COUNT(*) FROM S3Object

-- LIKE pattern matching
SELECT * FROM S3Object WHERE name LIKE 'A%'`}
            </pre>
          </Box>
        </Container>
      )}
    </SpaceBetween>
  );
}
