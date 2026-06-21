# AWS Services: ECR, ELB, SES Implementation Plan

## Goal
Implement three new AWS services in the Floci Dash: ECR (container registry), ELB (load balancers), and SES (email). Each follows the existing service-based vertical slice pattern.

## Architecture Pattern (established)
Each service follows:
1. Backend route file: `src/backend/routes/aws/{service}.ts`
2. Frontend hooks file: `src/frontend/hooks/use{Service}.ts`
3. UI components in `src/frontend/pages/ServicePage.tsx`
4. Backend tests: `src/backend/routes/aws/{service}.test.ts`
5. Frontend hook tests: `src/frontend/hooks/use{Service}.test.ts`
6. Register route in `src/backend/routes/aws/index.ts`

---

## Phase 1: ECR (Elastic Container Registry)

### Backend Route (`src/backend/routes/aws/ecr.ts`)
- `GET /ecr/repositories` — list repos (ListRepositories)
- `POST /ecr/repositories` — create repo (CreateRepository)
- `DELETE /ecr/repositories/:name` — delete repo (DeleteRepository)
- `GET /ecr/repositories/:name/images` — list images (ListImages + DescribeImages)
- `DELETE /ecr/repositories/:name/images` — batch delete images (BatchDeleteImage)
- `GET /ecr/repositories/:name/policy` — get repo policy (GetRepositoryPolicy)
- `PUT /ecr/repositories/:name/policy` — set repo policy (SetRepositoryPolicy)
- `DELETE /ecr/repositories/:name/policy` — delete repo policy (DeleteRepositoryPolicy)
- `GET /ecr/repositories/:name/lifecycle` — get lifecycle policy (GetLifecyclePolicy)
- `PUT /ecr/repositories/:name/lifecycle` — put lifecycle policy (PutLifecyclePolicy)

### Frontend Hooks (`src/frontend/hooks/useECR.ts`)
- `useECRRepositories()` — query hook
- `useECRCreateRepository()` — mutation
- `useECRDeleteRepository()` — mutation
- `useECRImages(repoName)` — query hook
- `useECRDeleteImages(repoName)` — mutation
- `useECRRepositoryPolicy(repoName)` — query hook
- `useECRSetRepositoryPolicy(repoName)` — mutation
- `useECRDeleteRepositoryPolicy(repoName)` — mutation
- `useECRLifecyclePolicy(repoName)` — query hook
- `useECRPutLifecyclePolicy(repoName)` — mutation

### UI Components
- `ECRDashboard` — repo list with search, create button, image count
- `ECRRepoDetail` — tabs: Images, Repository Policy, Lifecycle Policy

### Tests
- Backend: 12 tests (happy path, empty results, error cases)
- Frontend hooks: 10 tests (correct URL, enabled gates, mutations)

---

## Phase 2: ELB (Elastic Load Balancing v2)

### Backend Route (`src/backend/routes/aws/elb.ts`)
- `GET /elb/load-balancers` — list LBs (DescribeLoadBalancers)
- `POST /elb/load-balancers` — create LB (CreateLoadBalancer)
- `DELETE /elb/load-balancers/:arn` — delete LB (DeleteLoadBalancer)
- `GET /elb/load-balancers/:arn/attributes` — get LB attributes
- `PUT /elb/load-balancers/:arn/attributes` — modify LB attributes
- `GET /elb/target-groups` — list TGs (DescribeTargetGroups)
- `POST /elb/target-groups` — create TG (CreateTargetGroup)
- `DELETE /elb/target-groups/:arn` — delete TG (DeleteTargetGroup)
- `GET /elb/load-balancers/:arn/listeners` — list listeners
- `POST /elb/load-balancers/:arn/listeners` — create listener
- `DELETE /elb/listeners/:arn` — delete listener
- `POST /elb/target-groups/:arn/register` — register targets
- `POST /elb/target-groups/:arn/deregister` — deregister targets

### Frontend Hooks (`src/frontend/hooks/useELB.ts`)
- `useELBLoadBalancers()` — query hook
- `useELBCreateLoadBalancer()` — mutation
- `useELBDeleteLoadBalancer()` — mutation
- `useELBLoadBalancerAttributes(arn)` — query hook
- `useELBTargetGroups()` — query hook
- `useELBCreateTargetGroup()` — mutation
- `useELBDeleteTargetGroup()` — mutation
- `useELBListeners(lbArn)` — query hook
- `useELBCreateListener(lbArn)` — mutation
- `useELBDeleteListener()` — mutation
- `useELBRegisterTargets(tgArn)` — mutation
- `useELBDeregisterTargets(tgArn)` — mutation

### UI Components
- `ELBDashboard` — LB list with DNS, scheme, state
- `ELBLBDetail` — tabs: Listeners, Target Groups, Rules

### Tests
- Backend: 14 tests
- Frontend hooks: 12 tests

---

## Phase 3: SES (Simple Email Service)

### Backend Route (`src/backend/routes/aws/ses.ts`)
- `GET /ses/identities` — list identities (ListIdentities)
- `POST /ses/identities/verify-email` — verify email (VerifyEmailIdentity)
- `POST /ses/identities/verify-domain` — verify domain (VerifyDomainIdentity)
- `DELETE /ses/identities/:value` — delete identity (DeleteIdentity)
- `GET /ses/identities/:value` — get verification attributes
- `POST /ses/send-email` — send email (SendEmail)
- `GET /ses/sent` — list sent emails (from local store)

### Frontend Hooks (`src/frontend/hooks/useSES.ts`)
- `useSESIdentities()` — query hook
- `useSESVerifyEmail()` — mutation
- `useSESVerifyDomain()` — mutation
- `useSESDeleteIdentity()` — mutation
- `useSESSendEmail()` — mutation
- `useSESSentEmails()` — query hook

### UI Components
- `SESDashboard` — identity list, verify button, sent emails tab

### Tests
- Backend: 8 tests
- Frontend hooks: 6 tests

---

## Verification (after each phase)
```bash
pnpm run typecheck
pnpm run test:unit
pnpm run build
```

## Files Modified
| File | Action |
|------|--------|
| `src/backend/routes/aws/ecr.ts` | New |
| `src/backend/routes/aws/elb.ts` | New |
| `src/backend/routes/aws/ses.ts` | New |
| `src/frontend/hooks/useECR.ts` | New |
| `src/frontend/hooks/useELB.ts` | New |
| `src/frontend/hooks/useSES.ts` | New |
| `src/frontend/pages/ServicePage.tsx` | Add ECR, ELB, SES components |
| `src/backend/routes/aws/index.ts` | Register new routes |
| `src/backend/routes/aws/ecr.test.ts` | New |
| `src/backend/routes/aws/elb.test.ts` | New |
| `src/backend/routes/aws/ses.test.ts` | New |
| `src/frontend/hooks/useECR.test.ts` | New |
| `src/frontend/hooks/useELB.test.ts` | New |
| `src/frontend/hooks/useSES.test.ts` | New |
| `PLAN.md` | Mark tasks Done |
| `README.md` | Add services to table |
