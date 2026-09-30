import { create, getAwsConfig } from "./aws";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

// Floci reports its caller account via STS. ARN-addressed resources (budget
// tags, identity-pool tags, …) need that account plus the client region to
// rebuild ARNs the emulator's responses omit.
export async function callerAccountId(): Promise<string> {
  const sts = create(STSClient);
  const identity: any = await sts.send(new GetCallerIdentityCommand({}));
  return identity.Account;
}

export async function budgetArn(name: string): Promise<string> {
  return `arn:aws:budgets::${await callerAccountId()}:budget/${name}`;
}

export async function identityPoolArn(poolId: string): Promise<string> {
  const region = getAwsConfig().region;
  return `arn:aws:cognito-identity:${region}:${await callerAccountId()}:identitypool/${poolId}`;
}
