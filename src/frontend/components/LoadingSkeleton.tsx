import { Box, Skeleton, SpaceBetween } from "@cloudscape-design/components";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 3 }: TableSkeletonProps) {
  return (
    <SpaceBetween size="l">
      <Skeleton height="20px" width="120px" />
      <Box padding="s">
        <SpaceBetween size="m">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "16px" }}>
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} height="16px" width={j === 0 ? "40%" : "25%"} />
              ))}
            </div>
          ))}
        </SpaceBetween>
      </Box>
    </SpaceBetween>
  );
}

interface CardsSkeletonProps {
  count?: number;
}

export function CardsSkeleton({ count = 4 }: CardsSkeletonProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: "16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} padding="l">
          <SpaceBetween size="s">
            <Skeleton height="14px" width="60%" />
            <Skeleton height="28px" width="40%" />
            <Skeleton height="12px" width="80%" />
          </SpaceBetween>
        </Box>
      ))}
    </div>
  );
}

interface DetailSkeletonProps {
  lines?: number;
}

export function DetailSkeleton({ lines = 4 }: DetailSkeletonProps) {
  return (
    <Box padding="l">
      <SpaceBetween size="m">
        <Skeleton variant="text-heading-m" width="50%" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height="14px" width={i === lines - 1 ? "60%" : "90%"} />
        ))}
      </SpaceBetween>
    </Box>
  );
}

export function DashboardSkeleton() {
  return (
    <SpaceBetween size="xl">
      <Skeleton variant="text-heading-xl" width="280px" />
      <CardsSkeleton count={4} />
      <Box padding="l">
        <SpaceBetween size="m">
          <Skeleton height="18px" width="140px" />
          <Skeleton height="16px" width="100%" />
          <Skeleton height="16px" width="100%" />
          <Skeleton height="16px" width="80%" />
        </SpaceBetween>
      </Box>
    </SpaceBetween>
  );
}
