import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Textarea,
  StatusIndicator,
  Spinner,
  Alert,
} from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import { getServiceLabel } from "../types/services";
import StatusBadge from "../components/StatusBadge";
import {
  useS3Buckets,
  useS3Objects,
  useS3ObjectDetail,
  useS3CreateBucket,
  useS3DeleteBucket,
  useS3UploadObject,
  useS3DeleteObject,
} from "../hooks/useS3";

export default function ServicePage() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { data: health } = useHealth();

  // S3 state (must come before hook calls that reference state)
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [showUploadObject, setShowUploadObject] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [uploadKey, setUploadKey] = useState("");
  const [uploadBody, setUploadBody] = useState("");

  // S3 mutations
  const createBucket = useS3CreateBucket();
  const uploadObject = useS3UploadObject(selectedBucket || "");

  if (!service) return null;

  // Non-S3 services show placeholder
  if (service !== "s3") {
    const label = getServiceLabel(service);
    const status = (health?.services[service] || "available") as "running" | "available";
    return (
      <ContentLayout
        header={
          <SpaceBetween size="xs">
            <BreadcrumbGroup
              items={[
                { text: "All Services", href: "/#/" },
                { text: label, href: `/#/services/${service}` },
              ]}
              onFollow={(e) => {
                e.preventDefault();
                navigate(e.detail.href.replace("/#", ""));
              }}
            />
            <Header variant="h1">
              {label} <StatusBadge status={status} />
            </Header>
          </SpaceBetween>
        }
      >
        <Box textAlign="center" padding={{ top: "xxxl" }}>
          <Box variant="h2" padding={{ bottom: "s" }}>Coming soon</Box>
          <Box variant="p" color="text-body-secondary">
            S3 management is available. Other services coming in future phases.
          </Box>
        </Box>
      </ContentLayout>
    );
  }

  // S3 service
  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "All Services", href: "/#/" },
              ...(selectedBucket
                ? [
                    { text: "S3", href: "/#/services/s3" },
                    { text: selectedBucket, href: `/#/services/s3` },
                  ]
                : []),
            ]}
            onFollow={(e) => {
              e.preventDefault();
              const path = e.detail.href.replace("/#", "");
              navigate(path);
              if (path === "/services/s3") {
                setSelectedBucket(null);
                setSelectedObject(null);
              }
            }}
          />
          <Header variant="h1">
            S3{" "}
            <StatusBadge status={(health?.services["s3"] || "available") as "running" | "available"} />
          </Header>
        </SpaceBetween>
      }
    >
      {selectedBucket ? (
        <S3ObjectBrowser
          bucket={selectedBucket}
          selectedObject={selectedObject}
          onSelectObject={setSelectedObject}
          onBack={() => { setSelectedBucket(null); setSelectedObject(null); }}
          onUploadClick={() => setShowUploadObject(true)}
        />
      ) : (
        <S3BucketList
          onSelectBucket={(name) => setSelectedBucket(name)}
          onCreateClick={() => setShowCreateBucket(true)}
        />
      )}

      {/* Create Bucket Modal */}
      <Modal
        visible={showCreateBucket}
        onDismiss={() => { setShowCreateBucket(false); setNewBucketName(""); }}
        header="Create Bucket"
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
                      onSuccess: () => { setShowCreateBucket(false); setNewBucketName(""); },
                    });
                  }
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createBucket.isError && (
            <Alert type="error">{(createBucket.error as Error)?.message || "Failed to create bucket"}</Alert>
          )}
          <FormField label="Bucket name">
            <Input value={newBucketName} onChange={(e) => setNewBucketName(e.detail.value)} placeholder="my-bucket" />
          </FormField>
        </Form>
      </Modal>

      {/* Upload Object Modal */}
      <Modal
        visible={showUploadObject}
        onDismiss={() => { setShowUploadObject(false); setUploadKey(""); setUploadBody(""); }}
        header="Upload Object"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => { setShowUploadObject(false); setUploadKey(""); setUploadBody(""); }}>Cancel</Button>
              <Button
                variant="primary"
                loading={uploadObject.isPending}
                onClick={() => {
                  if (uploadKey && selectedBucket) {
                    uploadObject.mutate({ key: uploadKey, body: uploadBody }, {
                      onSuccess: () => { setShowUploadObject(false); setUploadKey(""); setUploadBody(""); },
                    });
                  }
                }}
              >
                Upload
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {uploadObject.isError && (
            <Alert type="error">{(uploadObject.error as Error)?.message || "Failed to upload object"}</Alert>
          )}
          <FormField label="Object key">
            <Input value={uploadKey} onChange={(e) => setUploadKey(e.detail.value)} placeholder="folder/file.txt" />
          </FormField>
          <FormField label="Content">
            <Textarea value={uploadBody} onChange={(e) => setUploadBody(e.detail.value)} rows={8} placeholder="Enter object content..." />
          </FormField>
        </Form>
      </Modal>
    </ContentLayout>
  );
}

// Sub-component: Bucket List
function S3BucketList({ onSelectBucket, onCreateClick }: { onSelectBucket: (name: string) => void; onCreateClick: () => void }) {
  const { data, isLoading, isError, error } = useS3Buckets();
  const deleteBucket = useS3DeleteBucket();

  return (
    <Table
      header={
        <Header
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="primary" onClick={onCreateClick}>Create bucket</Button>
            </SpaceBetween>
          }
        >
          Buckets ({data?.total ?? 0})
        </Header>
      }
      columnDefinitions={[
        { id: "name", header: "Name", cell: (item: any) => <Button variant="link" onClick={() => onSelectBucket(item.name)}>{item.name}</Button>, isRowHeader: true },
        { id: "created", header: "Created", cell: (item: any) => item.createdAt ? new Date(item.createdAt).toLocaleString() : "-" },
        {
          id: "actions",
          header: "",
          cell: (item: any) => (
            <Button
              variant="icon"
              iconName="remove"
              loading={deleteBucket.isPending && deleteBucket.variables === item.name}
              onClick={() => {
                if (confirm(`Delete bucket "${item.name}"?`)) deleteBucket.mutate(item.name);
              }}
            />
          ),
        },
      ]}
      items={data?.buckets || []}
      loading={isLoading}
      loadingText="Loading buckets..."
      empty={
        isError ? (
          <Box textAlign="center">
            <StatusIndicator type="error">{(error as Error)?.message || "Failed to load buckets"}</StatusIndicator>
          </Box>
        ) : (
          <Box textAlign="center" padding={{ top: "l" }}>
            <Box variant="p" padding={{ bottom: "s" }}>No buckets found</Box>
            <Button onClick={onCreateClick}>Create your first bucket</Button>
          </Box>
        )
      }
    />
  );
}

// Sub-component: Object Browser
function S3ObjectBrowser({
  bucket,
  selectedObject,
  onSelectObject,
  onBack,
  onUploadClick,
}: {
  bucket: string;
  selectedObject: string | null;
  onSelectObject: (key: string | null) => void;
  onBack: () => void;
  onUploadClick: () => void;
}) {
  const { data, isLoading } = useS3Objects(bucket);
  const deleteObject = useS3DeleteObject(bucket);

  if (selectedObject) {
    return (
      <S3ObjectViewer
        bucket={bucket}
        objectKey={selectedObject}
        onBack={() => onSelectObject(null)}
      />
    );
  }

  return (
    <SpaceBetween size="l">
      <Box>
        <SpaceBetween direction="horizontal" size="s">
          <Button variant="link" onClick={onBack}>← Buckets</Button>
          <Box variant="h3">{bucket}</Box>
        </SpaceBetween>
      </Box>
      <Table
        header={
          <Header
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" onClick={onUploadClick}>Upload object</Button>
              </SpaceBetween>
            }
          >
            Objects ({data?.total ?? 0})
          </Header>
        }
        columnDefinitions={[
          { id: "key", header: "Key", cell: (item: any) => <Button variant="link" onClick={() => onSelectObject(item.key)}>{item.key}</Button>, isRowHeader: true },
          { id: "size", header: "Size", cell: (item: any) => formatBytes(item.size) },
          { id: "modified", header: "Last Modified", cell: (item: any) => item.lastModified ? new Date(item.lastModified).toLocaleString() : "-" },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <Button
                variant="icon"
                iconName="remove"
                loading={deleteObject.isPending && deleteObject.variables === item.key}
                onClick={() => {
                  if (confirm(`Delete "${item.key}"?`)) deleteObject.mutate(item.key);
                }}
              />
            ),
          },
        ]}
        items={data?.objects || []}
        loading={isLoading}
        loadingText="Loading objects..."
        empty={
          <Box textAlign="center" padding={{ top: "l" }}>
            <Box variant="p" padding={{ bottom: "s" }}>No objects in this bucket</Box>
            <Button onClick={onUploadClick}>Upload your first object</Button>
          </Box>
        }
      />
    </SpaceBetween>
  );
}

// Sub-component: Object Viewer
function S3ObjectViewer({
  bucket,
  objectKey,
  onBack,
}: {
  bucket: string;
  objectKey: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useS3ObjectDetail(bucket, objectKey);

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <Box>
        <Button variant="link" onClick={onBack}>← Back</Button>
        <StatusIndicator type="error">{(error as Error)?.message || "Failed to load object"}</StatusIndicator>
      </Box>
    );
  }

  return (
    <SpaceBetween size="l">
      <Box>
        <SpaceBetween direction="horizontal" size="s">
          <Button variant="link" onClick={onBack}>← Objects</Button>
          <Box variant="h3">{objectKey}</Box>
        </SpaceBetween>
      </Box>
      <Box>
        <SpaceBetween size="xs">
          <Box variant="small">Size: {data?.size != null ? formatBytes(data.size) : "-"} | Type: {data?.contentType || "-"} | Modified: {data?.lastModified ? new Date(data.lastModified).toLocaleString() : "-"}</Box>
        </SpaceBetween>
      </Box>
      <Box>
        <Box variant="h4" padding={{ bottom: "xs" }}>Content</Box>
        <Box variant="code">{data?.body}</Box>
      </Box>
    </SpaceBetween>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
