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
  Tabs,
  ColumnLayout,
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

  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [showUploadObject, setShowUploadObject] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [uploadKey, setUploadKey] = useState("");
  const [uploadBody, setUploadBody] = useState("");

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
                { text: "Dashboard", href: "/#/" },
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

  const s3Status = (health?.services["s3"] || "available") as "running" | "available";

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
          <Header
            variant="h1"
            description="Scalable object storage — manage buckets and objects"
            info={<StatusBadge status={s3Status} />}
          >
            S3
          </Header>
        </SpaceBetween>
      }
    >
      <Tabs
        tabs={[
          {
            label: "Buckets",
            id: "buckets",
            content: selectedBucket ? (
              <S3ObjectBrowser
                bucket={selectedBucket}
                selectedObject={selectedObject}
                onSelectObject={setSelectedObject}
                onBack={() => { setSelectedBucket(null); setSelectedObject(null); }}
                onUploadClick={() => setShowUploadObject(true)}
              />
            ) : (
              <S3BucketList
                onSelectBucket={setSelectedBucket}
                onCreateClick={() => setShowCreateBucket(true)}
              />
            ),
          },
          { label: "Overview", id: "overview", content: <S3Overview /> },
        ]}
      />

      {/* Create Bucket Modal */}
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
                      onSuccess: () => { setShowCreateBucket(false); setNewBucketName(""); },
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
          <FormField
            label="Bucket name"
            description="Must be globally unique. Use lowercase letters, numbers, and hyphens."
          >
            <Input
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.detail.value)}
              placeholder="my-bucket"
            />
          </FormField>
        </Form>
      </Modal>

      {/* Upload Object Modal */}
      <Modal
        visible={showUploadObject}
        onDismiss={() => { setShowUploadObject(false); setUploadKey(""); setUploadBody(""); }}
        header={`Upload to ${selectedBucket}`}
        size="large"
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
            <Alert type="error" dismissible>{(uploadObject.error as Error)?.message || "Failed to upload"}</Alert>
          )}
          <FormField label="Key" description="Object key, e.g. folder/file.txt">
            <Input value={uploadKey} onChange={(e) => setUploadKey(e.detail.value)} placeholder="path/to/file.txt" />
          </FormField>
          <FormField label="Content">
            <Textarea value={uploadBody} onChange={(e) => setUploadBody(e.detail.value)} rows={10} placeholder="Enter content..." />
          </FormField>
        </Form>
      </Modal>
    </ContentLayout>
  );
}

// S3 Overview tab
function S3Overview() {
  const { data } = useS3Buckets();
  const bucketCount = data?.total ?? 0;

  return (
    <Box padding={{ top: "l" }}>
      <ColumnLayout columns={3} variant="text-grid">
        <div style={{ padding: 20, borderRadius: 10, border: "1px solid #539fe533" }}>
          <Box variant="small" color="text-body-secondary">Buckets</Box>
          <Box variant="h1" padding={{ top: "xxs" }}>
            <span style={{ color: "#539fe5" }}>{bucketCount}</span>
          </Box>
        </div>
        <div style={{ padding: 20, borderRadius: 10, border: "1px solid #037f0c33" }}>
          <Box variant="small" color="text-body-secondary">Status</Box>
          <Box variant="h4" padding={{ top: "xxs" }}>
            <StatusIndicator type="success">Active</StatusIndicator>
          </Box>
        </div>
        <div style={{ padding: 20, borderRadius: 10, border: "1px solid #a066ff33" }}>
          <Box variant="small" color="text-body-secondary">Region</Box>
          <Box variant="p" padding={{ top: "xxs" }}>
            <span style={{ color: "#a066ff" }}>us-east-1</span>
          </Box>
        </div>
      </ColumnLayout>
    </Box>
  );
}

// Bucket List
function S3BucketList({ onSelectBucket, onCreateClick }: { onSelectBucket: (name: string) => void; onCreateClick: () => void }) {
  const { data, isLoading, isError, error } = useS3Buckets();
  const deleteBucket = useS3DeleteBucket();

  return (
    <Table
      variant="full-page"
      header={
        <Header
          variant="h2"
          counter={`(${data?.total ?? 0})`}
          actions={
            <Button variant="primary" onClick={onCreateClick}>
              Create bucket
            </Button>
          }
        >
          Buckets
        </Header>
      }
      columnDefinitions={[
        {
          id: "name",
          header: "Name",
          cell: (item: any) => (
            <Button variant="link" onClick={() => onSelectBucket(item.name)}>
              {item.name}
            </Button>
          ),
          isRowHeader: true,
          width: 400,
        },
        {
          id: "created",
          header: "Created",
          cell: (item: any) =>
            item.createdAt ? new Date(item.createdAt).toLocaleString() : "—",
        },
        {
          id: "actions",
          header: "",
          width: 80,
          cell: (item: any) => (
            <Button
              variant="icon"
              iconName="remove"
              ariaLabel={`Delete ${item.name}`}
              loading={deleteBucket.isPending && deleteBucket.variables === item.name}
              onClick={() => {
                if (confirm(`Permanently delete bucket "${item.name}"?`))
                  deleteBucket.mutate(item.name);
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
          <Box textAlign="center" padding={{ top: "xl" }}>
            <StatusIndicator type="error">
              {(error as Error)?.message || "Failed to load buckets"}
            </StatusIndicator>
          </Box>
        ) : (
          <Box textAlign="center" padding={{ top: "xxl", bottom: "xxl" }}>
            <Box variant="h3" padding={{ bottom: "s" }}>No buckets</Box>
            <Box variant="p" color="text-body-secondary" padding={{ bottom: "l" }}>
              Create your first bucket to start storing objects in S3.
            </Box>
            <Button variant="primary" onClick={onCreateClick}>
              Create bucket
            </Button>
          </Box>
        )
      }
    />
  );
}

// Object Browser
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
    return <S3ObjectViewer bucket={bucket} objectKey={selectedObject} onBack={() => onSelectObject(null)} />;
  }

  return (
    <Table
      variant="full-page"
      header={
        <Header
          variant="h2"
          counter={`(${data?.total ?? 0})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="normal" onClick={onBack}>← Buckets</Button>
              <Button variant="primary" onClick={onUploadClick}>Upload</Button>
            </SpaceBetween>
          }
          description={bucket}
        >
          Objects
        </Header>
      }
      columnDefinitions={[
        {
          id: "key",
          header: "Key",
          cell: (item: any) => (
            <Button variant="link" onClick={() => onSelectObject(item.key)}>
              {item.key}
            </Button>
          ),
          isRowHeader: true,
          width: 500,
        },
        {
          id: "size",
          header: "Size",
          cell: (item: any) => formatBytes(item.size),
        },
        {
          id: "modified",
          header: "Last modified",
          cell: (item: any) =>
            item.lastModified
              ? new Date(item.lastModified).toLocaleString()
              : "—",
        },
        {
          id: "actions",
          header: "",
          width: 80,
          cell: (item: any) => (
            <Button
              variant="icon"
              iconName="remove"
              ariaLabel={`Delete ${item.key}`}
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
        <Box textAlign="center" padding={{ top: "xxl", bottom: "xxl" }}>
          <Box variant="h3" padding={{ bottom: "s" }}>No objects</Box>
          <Box variant="p" color="text-body-secondary" padding={{ bottom: "l" }}>
            This bucket is empty. Upload your first object.
          </Box>
          <Button variant="primary" onClick={onUploadClick}>Upload object</Button>
        </Box>
      }
    />
  );
}

// Object Viewer
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

  if (isLoading) return <Spinner size="large" />;
  if (isError) {
    return (
      <Box padding={{ top: "l" }}>
        <Button variant="link" onClick={onBack}>← Back</Button>
        <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>
      </Box>
    );
  }

  return (
    <SpaceBetween size="l">
      <Box>
        <Button variant="link" onClick={onBack}>← Objects</Button>
        <Box variant="h2" padding={{ top: "s" }}>{objectKey}</Box>
      </Box>
      <ColumnLayout columns={3} variant="text-grid">
        <div style={{ padding: 16, borderRadius: 8, border: "1px solid #539fe533" }}>
          <Box variant="small" color="text-body-secondary">Size</Box>
          <Box variant="p" padding={{ top: "xxs" }} fontWeight="bold">{data?.size != null ? formatBytes(data.size) : "—"}</Box>
        </div>
        <div style={{ padding: 16, borderRadius: 8, border: "1px solid #a066ff33" }}>
          <Box variant="small" color="text-body-secondary">Type</Box>
          <Box variant="p" padding={{ top: "xxs" }} fontWeight="bold">{data?.contentType || "—"}</Box>
        </div>
        <div style={{ padding: 16, borderRadius: 8, border: "1px solid #d8991433" }}>
          <Box variant="small" color="text-body-secondary">Modified</Box>
          <Box variant="p" padding={{ top: "xxs" }} fontWeight="bold">{data?.lastModified ? new Date(data.lastModified).toLocaleString() : "—"}</Box>
        </div>
      </ColumnLayout>
      <Box>
        <Box variant="h3" padding={{ bottom: "s" }}>Content</Box>
        <Box
          variant="code"
          padding={{ top: "m", bottom: "m", left: "m", right: "m" }}
        >
          {data?.body || "[Empty]"}
        </Box>
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
