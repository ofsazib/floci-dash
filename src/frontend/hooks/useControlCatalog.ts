import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface CcControlSummary {
  Arn?: string;
  Name?: string;
  Behavior?: string;
  Severity?: string;
}

export interface CcControl extends CcControlSummary {
  Description?: string;
  ParameterRequirementSummary?: string;
}

const arnPath = (arn: string) => arn.replace(/^arn:/, "");

export function useCcControls() {
  return useQuery({
    queryKey: ["aws", "controlcatalog", "controls"],
    queryFn: () =>
      api<{ controls: CcControlSummary[]; nextToken: string | null }>(
        "/aws/controlcatalog/controls"
      ),
  });
}

export function useCcControl(arn: string | null) {
  return useQuery({
    queryKey: ["aws", "controlcatalog", "control", arn],
    queryFn: () =>
      api<{ control: CcControl | null }>(
        `/aws/controlcatalog/controls/${arnPath(arn!)}`
      ),
    enabled: !!arn,
  });
}
