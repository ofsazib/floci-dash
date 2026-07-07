// Auto-split from ServicePage.tsx. Shared import preamble is intentional;
// unused imports are tree-shaken at build (noUnusedLocals is off).
import { useState } from "react";
import {
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Button,
  Alert,
} from "@cloudscape-design/components";
import { useS3Buckets, useS3CreateBucket, useS3DeleteBucket } from "../../hooks/useS3";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function S3Dashboard() {
  const { data, isLoading, isError, error } = useS3Buckets();
  const createBucket = useS3CreateBucket();
  const deleteBucket = useS3DeleteBucket();
  const [showCreate, setShowCreate] = useState(false);
  const [bucketName, setBucketName] = useState("");

  const items = (data?.buckets || []).map((b: any) => ({
    name: b.name,
    createdAt: b.createdAt,
    region: b.region || "us-east-1",
  }));

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load buckets"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Bucket"
        headerTitle="S3 Buckets"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Bucket name",
            cell: (item: any) => (
              <Button
                variant="link"
                onClick={() => {
                  window.location.hash = `#/services/s3?bucket=${encodeURIComponent(item.name)}`;
                }}
              >
                {item.name}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "created",
            header: "Created",
            cell: (item: any) =>
              item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "—",
          },
          {
            id: "region",
            header: "Region",
            cell: (item: any) => item.region || "—",
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="bucket"
                loading={
                  deleteBucket.isPending && deleteBucket.variables === item.name
                }
                onDelete={() => deleteBucket.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No buckets found. Create one to start storing objects in S3."
        filterEnabled
        filterPlaceholder="Find buckets by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          setBucketName("");
        }}
        header="Create Bucket"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  setBucketName("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createBucket.isPending}
                disabled={!bucketName}
                onClick={() => {
                  if (bucketName) {
                    createBucket.mutate(bucketName, {
                      onSuccess: () => {
                        setShowCreate(false);
                        setBucketName("");
                      },
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
            <Alert type="error" dismissible>
              {(createBucket.error as Error)?.message || "Failed to create bucket"}
            </Alert>
          )}
          <FormField
            label="Bucket name"
            description="Must be globally unique. Use lowercase letters, numbers, and hyphens."
          >
            <Input
              value={bucketName}
              onChange={({ detail }) => setBucketName(detail.value)}
              placeholder="my-bucket"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}
