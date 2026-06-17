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
import {
  useS3Buckets,
  useS3Objects,
  useS3ObjectDetail,
  useS3CreateBucket,
  useS3DeleteBucket,
  useS3UploadFiles,
  useS3DeleteObject,
  useS3CreateFolder,
  type S3UploadResult,
} from "../hooks/useS3";
import {
  useS3ObjectTags,
  useS3UpdateObjectTags,
  type S3Tag,
} from "../hooks/useS3Config";
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
  const [currentPrefix, setCurrentPrefix] = useState("");
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
    if (key && selectedBucket) {
      setSearchParams({ bucket: selectedBucket, object: key });
    } else if (selectedBucket) {
      setSearchParams({ bucket: selectedBucket });
    }
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
    if (!selectedBucket || uploadFiles.length === 0) return;
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
              onUploadClick={() => { setUploadPrefix(currentPrefix); setShowUploadObject(true); }}
              onPrefixChange={setCurrentPrefix}
            />
          ),
        },
        {
          label: "Configuration",
          id: "config",
          content: <S3BucketConfig bucket={selectedBucket} />,
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
              if (path === "/services/s3" || path.startsWith("/services/s3?")) {
                const url = new URL(`http://x${path}`);
                const b = url.searchParams.get("bucket");
                if (!b) selectBucket(null);
                else navigate(path);
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
                uploadButtonText: (multiple: boolean) => (multiple ? "Choose files" : "Choose file"),
                dropzoneText: (multiple: boolean) =>
                  multiple
                    ? "Drag and drop files here, or click 'Choose files'"
                    : "Drag and drop a file here, or click 'Choose file'",
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

function S3ObjectBrowser({ bucket, selectedObject, onSelectObject, onBack, onUploadClick, onPrefixChange }: {
  bucket: string; selectedObject: string | null; onSelectObject: (key: string | null) => void; onBack: () => void; onUploadClick: () => void; onPrefixChange?: (prefix: string) => void;
}) {
  const [prefix, setPrefix] = useState("");
  const { data, isLoading } = useS3Objects(bucket, prefix);
  const deleteObject = useS3DeleteObject(bucket);
  const createFolder = useS3CreateFolder(bucket);
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [searchTerm, setSearchTerm] = useState("");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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

  function handlePrefixChange(newPrefix: string) {
    setPrefix(newPrefix);
    onPrefixChange?.(newPrefix);
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
        header={
          <Header
            variant="h2"
            counter={`(${totalCount})`}
            description={bucket}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
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
                      {i > 0 && <span style={{ margin: "0 4px", color: "#aab3b0" }}>/</span>}
                      {item.prefix != null ? (
                        <Button variant="link" onClick={() => navigateToFolder(item.prefix!)}>
                          {item.text}
                        </Button>
                      ) : (
                        <span style={{ fontWeight: i === 0 ? 600 : 400 }}>{item.text}</span>
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
          { id: "actions", header: "", width: 80, cell: (item: any) => item._isFolder ? null : (
            <Button variant="icon" iconName="remove" ariaLabel={`Delete ${item.key}`} loading={deleteObject.isPending && deleteObject.variables === item.key}
              onClick={async () => {
                const ok = await confirm({ title: "Delete object", message: `Delete "${item.key}" from bucket "${bucket}"?`, confirmText: "Delete", variant: "danger" });
                if (ok) deleteObject.mutate(item.key, {
                  onSuccess: () => showToast("success", `Object "${item.key}" deleted`),
                  onError: (err) => showToast("error", err.message),
                });
              }} />
          )},
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

  if (isLoading) return <Spinner size="large" />;
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
                <Button variant="icon" iconName="remove" onClick={() => setTagPairs((prev) => prev.filter((_, idx) => idx !== i))} />
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
