# AWS Organizations: console AWS thật vs Floci Dash

> Ngày khảo sát: 2026-10-25 · Nhánh: `fix/organizations-page-display` (đã có fix #12)
> Phạm vi: `src/frontend/pages/services/OrganizationsDashboard.tsx`, `src/frontend/hooks/useOrganizations.ts`, `src/backend/routes/aws/organizations.ts`
> Đối chiếu với: AWS Organizations User Guide, ảnh chụp console thật, source Floci `services/organizations/`

**Ký hiệu mức độ**
- 🔴 Lỗi hoặc thiếu chức năng nghiêm trọng (dữ liệu bị ẩn, thao tác không làm được, dễ mất dữ liệu)
- 🟠 Thiếu chức năng mà console AWS có
- 🟡 Khác biệt về giao diện hoặc trải nghiệm

**Lưu ý quan trọng:** Floci đã hỗ trợ gần như đầy đủ API Organizations (hơn 50 action, xem mục 16). Hầu hết các khác biệt dưới đây là **thiếu sót của dashboard**, không phải giới hạn của Floci.

---

## 0. Tóm tắt các vấn đề nghiêm trọng nhất

| # | Vấn đề | Mức |
|---|--------|-----|
| 1 | Không có nút xóa OU, đóng account hay xóa policy: `ResourceTable` nhận `onDelete` nhưng không bao giờ vẽ nút gọi nó | 🔴 |
| 2 | Account nằm trong OU không hiện ở đâu cả: tab Accounts chỉ gọi `ListAccountsForParent(root)` | 🔴 |
| 3 | Chỉ thấy OU cấp 1, không tạo được OU lồng nhau (parent luôn là root) | 🔴 |
| 4 | "Delete Organization" xóa ngay khi bấm, không có hộp thoại xác nhận | 🔴 |
| 5 | Tạo account luôn gắn thêm một tag rác `ParentId=<rootId>`, do backend nhét `parentId` vào `Tags` | 🔴 |
| 6 | Không có chế độ xem cây (Hierarchy) và menu Actions, vốn là cách thao tác chính của console AWS | 🟠 |
| 7 | Không có trang chi tiết cho account, OU, root hay policy | 🟠 |
| 8 | Chỉ hỗ trợ SCP. Không có RCP, Tag, Backup, AI opt-out… và không bật/tắt được policy type | 🟠 |
| 9 | Không gắn/gỡ được policy, dù hook và route đã có sẵn | 🟠 |
| 10 | Không có Invitations, Services (trusted access), Settings (delegated admin) | 🟠 |

---

## 1. Điều hướng tổng thể

| AWS console | Floci Dash | Mức |
|---|---|---|
| Thanh điều hướng trái riêng của service: **AWS accounts** (có mục con **Invitations**), **Services**, **Policies**, **Settings**, **Get started** | 4 tab ngang: Organization, Organizational Units, Accounts, Policies (SCPs) | 🟡 |
| Hiện **Organization ID** cố định ở cuối thanh điều hướng trái | ID chỉ hiện trong tab Organization | 🟡 |
| Mỗi trang có URL riêng: `/organizations/v2/home/accounts`, `/accounts/add/create`, `/policies/service-control-policy`, `/settings`… | Một URL `/#/services/organizations`. Tab đang chọn không lưu vào URL, nên reload là về tab đầu | 🟡 |
| Breadcrumb nhiều cấp: AWS Organizations › AWS accounts › Add an AWS account | Breadcrumb chỉ có Dashboard › Organizations | 🟡 |
| Một tiêu đề trang | **Tiêu đề bị lặp:** `ServicePage` vẽ "Organizations · Running · Manage resources", rồi dashboard lại vẽ "Organizations · AWS Organizations — manage OUs, accounts, and SCPs" | 🟡 |
| Tên service: "AWS Organizations" | "Organizations" | 🟡 |

## 2. Khi chưa có organization (trang giới thiệu)

| AWS | Floci | Mức |
|---|---|---|
| Trang giới thiệu: hero "AWS Organizations — Central management for multiple AWS accounts", hộp **Create an organization** (nút màu cam) kèm ghi chú về feature set "all features" và link "consolidated billing features", cùng các mục About, How it works (sơ đồ 4 bước), Pricing, Getting started, More resources | Một dòng chữ "No organization. Click "Create Organization" to get started." và nút ở header | 🟡 |
| Thanh điều hướng lúc này chỉ có **Invitations**, để xem lời mời gia nhập organization khác | Không có | 🟠 |
| Có thể chọn tạo organization chỉ với consolidated billing | Luôn tạo với feature set mặc định, không có lựa chọn | 🟠 |

## 3. Trang AWS accounts (trang chính của console)

### 3.1 Bố cục
| AWS | Floci | Mức |
|---|---|---|
| Tiêu đề "AWS accounts", đoạn mô tả về management account và billing, link **Learn more** | Không có | 🟡 |
| Nút **Add an AWS account** (primary) ở góc phải tiêu đề | Nút "Create Account" nằm trong tab Accounts, bên ngoài header bảng | 🟡 |
| Banner kiểu "**1 request** to create an AWS account has failed in the last 90 days", link sang danh sách trạng thái tạo account | Không có. Route `GET /accounts/create-status` có nhưng không được dùng | 🟠 |
| Một container "Organization" (kèm mô tả về OU) chứa toàn bộ cây | Tách thành 3 bảng phẳng ở 3 tab | 🟠 |

### 3.2 Chế độ xem cây (Hierarchy)
| AWS | Floci | Mức |
|---|---|---|
| Nút chuyển **Hierarchy / List** | Không có | 🟠 |
| Cây Root → OU → OU con → account, mỗi nút cha có nút mở/thu (▶/▼) | Không có cây. Root hiện dưới dạng nút bấm "Root (r-xxxx)" | 🟠 |
| Biểu tượng riêng cho root, OU (thư mục) và account (khối hộp) | Không có | 🟡 |
| Dưới tên mỗi mục hiện ID nhỏ (`r-…`, `ou-…`, `<account id> \| <email>`) | ID nằm ở cột riêng | 🟡 |
| Tên root, OU và account là **link** sang trang chi tiết | Chỉ là chữ, không bấm được | 🟠 |
| Cột **Account created/joined date**, ghi "Joined 2022/10/27" hoặc "Created 2022/11/04" theo `JoinedMethod` | Không có, dù API đã trả `JoinedTimestamp` và `JoinedMethod` | 🟠 |
| Nhãn **management account** cạnh account quản lý | Không có | 🟠 |
| Nhãn **CLOSED** (giữ tối đa 90 ngày) cho account đã đóng | Chỉ có cột Status: `ACTIVE` màu xanh, mọi giá trị khác màu vàng "warning" | 🟡 |
| Nút "**Load more accounts in '<ou-name>'**" khi một OU có nhiều account (phân trang) | Không phân trang. Mọi route list bỏ qua `NextToken` | 🟠 |
| 🔴 Account trong mọi OU đều hiển thị | **Account đã chuyển vào OU biến mất khỏi UI**, vì chỉ gọi account trực tiếp dưới root | 🔴 |
| 🔴 OU ở mọi cấp đều hiển thị | Chỉ có OU cấp 1 dưới root | 🔴 |

### 3.3 Chế độ List và tìm kiếm
| AWS | Floci | Mức |
|---|---|---|
| Công tắc **View AWS accounts only**: danh sách phẳng mọi account, không có OU | Tab Accounts là danh sách phẳng nhưng **thiếu** account trong OU | 🔴 |
| Ô tìm kiếm "Find AWS accounts by name, email, or account ID. Find an OU by the exact OU ID." | Không có ô tìm kiếm, dù `ResourceTable` hỗ trợ `filterEnabled` | 🟠 |

### 3.4 Chọn mục và menu Actions
| AWS | Floci | Mức |
|---|---|---|
| Checkbox cho từng root, OU và account, chọn được nhiều mục | Không chọn được dòng nào | 🟠 |
| Menu **Actions**, nhóm **Organizational unit**: **Create new**, **Rename**, **Delete** | Chỉ có "Create OU" (luôn tạo dưới root). Không đổi tên được. Nút xóa không hiện (mục 15.1) | 🔴 |
| Menu **Actions**, nhóm **AWS account**: **Move**, **Remove from organization**, **Export account list** | Không có thao tác nào | 🟠 |
| Mục nào không áp dụng cho phần đang chọn thì bị vô hiệu hóa | Không áp dụng | 🟡 |

## 4. Thêm account

### 4.1 Tạo account mới (`/accounts/add/create`)
| AWS | Floci | Mức |
|---|---|---|
| Trang riêng, phía trên có hai thẻ radio: **Create an AWS account** / **Invite an existing AWS account** | Modal nhỏ, chỉ tạo được account mới | 🟠 |
| **AWS account name**: bắt buộc | "Name (optional)": không bắt buộc | 🟠 |
| **Email address of the account's owner**: bắt buộc, mỗi email chỉ dùng cho một account | "Email": bắt buộc nhưng không kiểm tra định dạng | 🟡 |
| **IAM role name** (tùy chọn), có mô tả, mặc định `OrganizationAccountAccessRole` | Không có. Backend đã nhận `roleName` nhưng UI không gửi | 🟠 |
| Mục **Tags**: "Add tag", tối đa 50 tag, có dòng "You can add 50 more tags." | Không có | 🟠 |
| Nút **Cancel** / **Create AWS account** ở cuối trang | Cancel / Create | 🟡 |
| Tạo account là việc bất đồng bộ (`CreateAccountStatus` = `IN_PROGRESS` → `SUCCEEDED`/`FAILED`). Console quay về danh sách và báo số request thất bại | Chỉ hiện toast "Account creation initiated", không theo dõi trạng thái | 🟠 |
| 🔴 Account mới được tạo ở root, không thêm tag nào ngoài tag người dùng nhập | **Backend tự thêm tag `ParentId=<rootId>`** vào mọi account (`organizations.ts`, route `POST /accounts`) | 🔴 |
| Không có tùy chọn IAM billing access trên console | Backend có nhận `iamUserAccessToBilling` | 🟡 |

### 4.2 Mời account có sẵn (`/accounts/add/invite`)
| AWS | Floci | Mức |
|---|---|---|
| **Email address or account ID of the AWS account to invite**, **Message to include in the invitation email message**, **Add tags**, nút **Send invitation**, sau đó chuyển sang trang Invitations | Không có. Floci đã hỗ trợ `InviteAccountToOrganization` nhưng dashboard chưa có route | 🟠 |

## 5. Trang chi tiết account

| AWS | Floci | Mức |
|---|---|---|
| Bấm tên account sẽ mở trang chi tiết với hộp **Account details**: tên, ID, email, ARN, cách tham gia (joined method), ngày tham gia, trạng thái, đường dẫn trong cây | Không có trang chi tiết. Hook `useOrgAccount` có nhưng không được dùng | 🟠 |
| Tab **Policies**: policy gắn với account, nhóm theo loại policy, mỗi nhóm có nút **Attach** / **Detach** | Không có | 🟠 |
| Tab **Tags**: xem, thêm, xóa tag | Không có. Hook `useOrgTags`, `useTagOrgResource`, `useUntagOrgResource` có nhưng không được dùng | 🟠 |
| Nút **Close Account** ở đầu trang; hộp xác nhận yêu cầu đọc hướng dẫn và **gõ account ID** | Prop `onDelete` gọi `closeAccount` nhưng nút không bao giờ hiện, và cũng không có xác nhận | 🔴 |

## 6. Organizational unit

| Thao tác | AWS | Floci | Mức |
|---|---|---|---|
| Tạo | Chọn OU cha trong cây (nhiều cấp, tối đa 5 cấp) → Actions › Create new → hộp thoại **Create organizational unit**: tên + **Add tag** (tối đa 50) → nút **Create organizational unit** | Modal chỉ có Name. Parent luôn là root. Không có tag | 🔴 |
| Tên trùng | Lỗi `DuplicateOrganizationalUnitException` (Floci đã giả lập) | Lỗi hiện thô trong modal | 🟡 |
| Đổi tên | Actions › Rename | Không có. Có `useUpdateOrgOU` và route `PUT /ous/:id` nhưng không được dùng | 🟠 |
| Xóa | Chọn một hoặc nhiều OU → Actions › Delete → gõ **tên OU** (khi xóa 1 OU) hoặc chữ **delete** (khi xóa nhiều) → **Delete**. OU phải rỗng | Nút xóa không hiện. Không có xác nhận | 🔴 |
| OU không rỗng | Lỗi `OrganizationalUnitNotEmptyException` | Không áp dụng (không xóa được) | 🟡 |
| Trang chi tiết | Hộp **Organizational unit details** (tên, ID, ARN), danh sách con, tab **Policies** và **Tags** | Không có. Có `useOrgOU` nhưng không được dùng | 🟠 |
| Cột trong bảng | Không có bảng OU riêng; OU nằm trong cây | Name, ID, **ARN dài** chiếm gần hết chiều ngang | 🟡 |

## 7. Root

| AWS | Floci | Mức |
|---|---|---|
| Root là nút gốc của cây; bấm vào mở trang chi tiết **Root** (ID, ARN, tab Policies, Tags) | Root hiện dưới dạng nút primary "Root (r-3yx8)" dùng để "chọn root", trong khi một organization chỉ có một root | 🟡 |
| Policy type đang bật được thể hiện ở root (`PolicyTypes`) | Không hiển thị | 🟠 |

## 8. Chuyển, gỡ và đóng account

| Thao tác | AWS | Floci | Mức |
|---|---|---|---|
| Chuyển account | Chọn một hoặc nhiều account → Actions › Move → hộp **Move AWS account** với cây để chọn OU hoặc root đích → **Move AWS account** → flashbar xanh "Successfully moved the AWS account '…' to the organizational unit '…'." | Không có. Có `useMoveOrgAccount` và route `POST /accounts/move` nhưng không được dùng | 🟠 |
| Gỡ khỏi organization | Actions › Remove from organization → hộp "Remove account '<name>' (#<id>) from organization?" → **Remove account** | Không có. Có `useRemoveOrgAccount` nhưng không được dùng | 🟠 |
| Đóng account | Close Account → gõ account ID → **Close account**; nhãn `CLOSED` giữ 90 ngày | Nút không hiện (mục 15.1) | 🔴 |
| Xuất danh sách | Actions › Export account list | Không có | 🟡 |
| Rời organization (từ phía member) | Nút **Leave organization** khi đăng nhập bằng member account | Có `useLeaveOrg` nhưng không có UI | 🟡 |

## 9. Invitations (lời mời và handshake)

| AWS | Floci | Mức |
|---|---|---|
| Trang **Invitations** (mục con của AWS accounts): danh sách lời mời đã gửi, trạng thái **OPEN** / ACCEPTED / DECLINED / CANCELED / EXPIRED, hạn 15 ngày, có thể hủy | Không có trang, hook hay route nào | 🟠 |
| Phía account được mời: xem, chấp nhận hoặc từ chối lời mời | Không có | 🟠 |
| Floci hỗ trợ: `InviteAccountToOrganization`, `AcceptHandshake`, `DeclineHandshake`, `CancelHandshake`, `DescribeHandshake`, `ListHandshakesForAccount`, `ListHandshakesForOrganization` | Chưa dùng | — |

## 10. Policies

### 10.1 Trang Policies (danh sách loại policy)
| AWS | Floci | Mức |
|---|---|---|
| Trang **Policies** liệt kê các loại: **Authorization policies** (Service control policies, Resource control policies) và **Management/Declarative policies** (Declarative policies for EC2, Backup, Tag, Chat applications, AI services opt-out, Security Hub, Amazon Inspector, Amazon Bedrock, Upgrade rollout, S3, GuardDuty) | Chỉ có SCP, cố định `SERVICE_CONTROL_POLICY` | 🟠 |
| Mỗi loại hiện trạng thái **Enabled / Disabled** | Không có | 🟠 |
| Vào một loại đang tắt sẽ thấy nút **Enable <policy type>**; khi đã bật thì có **Disable** | Không có, dù đã có route `/policies/enable-type` và `/disable-type` | 🟠 |
| Floci hỗ trợ các loại: SCP, RCP, TAG, BACKUP, AISERVICES_OPT_OUT, CHATBOT, SECURITYHUB, INSPECTOR, UPGRADE_ROLLOUT, BEDROCK, S3, NETWORK_SECURITY_DIRECTOR… | Chưa dùng | — |

### 10.2 Danh sách policy theo loại
| AWS | Floci | Mức |
|---|---|---|
| Bảng có cột tên (link sang trang chi tiết), loại (**AWS managed** / **Customer managed**), mô tả; chọn dòng; nút **Create policy**, **Actions** (Edit, Delete) | Bảng Name / ID / Description / "AWS Managed: Yes/No"; tên không bấm được; không chọn dòng; không xóa được | 🟠 |
| Có ô tìm kiếm | Không có | 🟡 |

### 10.3 Tạo policy (`Create new service control policy`)
| AWS | Floci | Mức |
|---|---|---|
| Trang riêng toàn màn hình | Modal | 🟡 |
| **Policy name** (bắt buộc) | Name | — |
| **Policy description** (tùy chọn) | **Không có**, dù backend nhận `description` | 🟠 |
| **Tags**: Add tag, tối đa 50 | Không có | 🟠 |
| Trình soạn thảo JSON có tô màu cú pháp, đánh số dòng, báo lỗi, kèm khung **Edit statement** bên phải: **Add actions** (chọn service, rồi chọn action hoặc All actions), **Add resource**, **Add condition**, **Add statement** | `Textarea` thường, 10 dòng, không kiểm tra JSON | 🟠 |
| Kiểm tra kích thước (SCP tối đa 10.240 ký tự, RCP 5.120) và cú pháp trước khi lưu | Không kiểm tra; lỗi từ server hiện thô | 🟡 |
| Policy mới mặc định là Deny statement mẫu | Placeholder `{"Version":"2012-10-17","Statement":[]}` (statement rỗng không hợp lệ với SCP thật) | 🟡 |
| Chọn được loại policy (tạo từ trang của loại đó) | Luôn là SCP | 🟠 |

### 10.4 Trang chi tiết policy
| AWS | Floci | Mức |
|---|---|---|
| Phần đầu: ARN, mô tả, loại; nút **Edit policy**, **Delete** | Không có trang chi tiết | 🟠 |
| Tab **Content**: JSON đã format | Không có | 🟠 |
| Tab **Targets**: các root/OU/account đã gắn; nút **Attach** / **Detach** | Không có. Có `useOrgPolicyTargets` nhưng không được dùng | 🟠 |
| Tab **Tags** (ẩn với policy do AWS quản lý) | Không có | 🟠 |
| Sửa policy (tên, mô tả, nội dung) | Không có. Có `useUpdateOrgPolicy` nhưng không được dùng | 🟠 |
| Xóa policy (chỉ khi không còn gắn vào đâu) | Nút xóa không hiện (mục 15.1) | 🔴 |
| Policy do AWS quản lý (`FullAWSAccess`) không sửa hay xóa được | Không phân biệt | 🟡 |

### 10.5 Gắn và gỡ policy
| AWS | Floci | Mức |
|---|---|---|
| Hai cách: (a) trên trang root/OU/account → tab Policies → nhóm theo loại → **Attach** → chọn policy → **Attach policy**; (b) trên trang policy → tab Targets → **Attach** → chọn target bằng radio trong cây → **Attach policy** | Không có. `useAttachOrgPolicy`, `useDetachOrgPolicy`, `useOrgTargetPolicies` được **import nhưng không dùng** trong `OrganizationsDashboard.tsx` | 🟠 |
| Gỡ policy cuối cùng của một target bị chặn (AWS bắt buộc mỗi target có ít nhất 1 SCP) | Không áp dụng | 🟡 |

### 10.6 Effective policy
| AWS | Floci | Mức |
|---|---|---|
| Xem **effective policy** của OU hoặc account cho các loại declarative/management (Tag, Backup, AI opt-out…). **Không hỗ trợ SCP và RCP** | Route `/effective-policy` gọi với `PolicyType: "SERVICE_CONTROL_POLICY"` cố định, tức là đúng loại mà AWS không hỗ trợ; còn bắt nhầm lỗi `PolicyInUseException` | 🔴 (route sai) / 🟠 (thiếu UI) |
| Floci hỗ trợ `ListAccountsWithInvalidEffectivePolicy` | Chưa dùng | 🟡 |

## 11. Services (trusted access)

| AWS | Floci | Mức |
|---|---|---|
| Trang **Services**: danh sách các service tích hợp với Organizations, cột trạng thái trusted access và delegated administrator | Không có | 🟠 |
| Bấm vào một service → **Enable trusted access** (tick "Show the option to enable trusted access", gõ **enable**) / **Disable trusted access** (gõ **disable**) | Không có | 🟠 |
| Floci hỗ trợ: `EnableAWSServiceAccess`, `DisableAWSServiceAccess`, `ListAWSServiceAccessForOrganization`, `RegisterDelegatedAdministrator`, `DeregisterDelegatedAdministrator`, `ListDelegatedAdministrators`, `ListDelegatedServicesForAccount` | Chưa dùng | — |

## 12. Settings

| AWS | Floci | Mức |
|---|---|---|
| Trang **Settings**: **Organization details**: Organization ID, ARN, **management account name, email, ID**, feature set | Tab Organization chỉ có ID, ARN và chữ "Active" **viết cứng**. Không hiện `MasterAccountId`, `MasterAccountEmail`, `FeatureSet` dù API đã trả về | 🟠 |
| **Enable all features** (khi org đang ở chế độ consolidated billing) | Không có. Có `useEnableAllFeatures` nhưng không được dùng | 🟡 |
| **Delegated administrator for AWS Organizations**: tạo, xem, sửa, xóa **resource-based delegation policy** bằng trình soạn JSON | Không có. Floci hỗ trợ `PutResourcePolicy`, `DescribeResourcePolicy`, `DeleteResourcePolicy` | 🟠 |
| **Delete organization** nằm trong Settings, yêu cầu **gõ organization ID** để xác nhận, và chỉ xóa được khi đã gỡ hết member account | 🔴 Nút **Delete Organization** nằm ngay header trang chính, bấm là xóa luôn, **không xác nhận** | 🔴 |

## 13. Tags

| AWS | Floci | Mức |
|---|---|---|
| Account, OU, root và policy đều có tab hoặc mục Tags (Add/Remove, tối đa 50); thêm tag được ngay khi tạo | Không có UI tag ở đâu cả. Route và hook đã đủ (`/tags`, `/tags/remove`) | 🟠 |

## 14. Trải nghiệm chung (UX)

| AWS | Floci | Mức |
|---|---|---|
| Thông báo thành công/lỗi bằng **Flashbar** toàn chiều rộng (xanh lá/đỏ) ở đầu trang, có nút đóng | Toast ở góc màn hình | 🟡 |
| Lỗi trong form hiện bằng `FormField errorText` hoặc `Alert` | Một dòng `Box` chữ đỏ phía trên form | 🟡 |
| Mọi thao tác phá hủy đều có hộp xác nhận, phải gõ tên, ID hoặc chữ "delete" | Không có xác nhận nào (xóa org); các thao tác xóa khác thì không hiện | 🔴 |
| Bảng có phân trang hoặc "Load more", tìm kiếm, nút refresh | Không có | 🟡 |
| Trạng thái loading bằng spinner hoặc skeleton của Cloudscape | Tab Organization hiện chữ "Loading..." | 🟡 |
| Light mode mặc định, nút primary màu cam (theme console AWS) | Dark mode, nút primary màu xanh (theme Cloudscape open-source). Khác biệt theme, không phải lỗi | 🟡 |
| Nút primary nằm ở `Header actions` của container hoặc bảng | Nút "Create …" đặt rời phía trên bảng | 🟡 |

## 15. Lỗi kỹ thuật tìm thấy trong code (không chỉ là khác biệt UI)

### 15.1 🔴 `ResourceTable` bỏ qua `onDelete`
`src/frontend/components/ResourceTable.tsx` khai báo `onDelete` (dòng 20, 53) nhưng chỉ dùng để tính độ rộng cột `actions` (dòng 82). Không có nút nào gọi `onDelete`. Hậu quả: cả ba bảng của Organizations (OU, Account, Policy) **không xóa hay đóng được gì**. Đã kiểm tra: các dashboard khác đều tự khai báo cột `actions` có `DeleteButton`; **chỉ `OrganizationsDashboard.tsx`** truyền `onDelete` cho `ResourceTable` mà không có cột này.

### 15.2 🔴 Danh sách account thiếu account trong OU
`useOrgAccounts(rootId)` → `GET /accounts?parentId=<root>` → `ListAccountsForParent`. Nên dùng `ListAccounts` (không có parentId) cho chế độ "View AWS accounts only", và `ListAccountsForParent` cho từng nút khi dựng cây.

### 15.3 🔴 Tag rác khi tạo account
`src/backend/routes/aws/organizations.ts`, `POST /accounts`: `Tags: body.parentId ? [{ Key: "ParentId", Value: body.parentId }] : undefined`. AWS `CreateAccount` không có tham số parent (account luôn tạo ở root), nên đây là cách làm tạm và gây sai dữ liệu. Frontend luôn gửi `parentId: rootId`.

### 15.4 🔴 Xóa organization không có xác nhận
`OrganizationsDashboard.tsx`: `onClick={handleDeleteOrg}` gọi `deleteOrg.mutateAsync()` ngay lập tức.

### 15.5 🟠 Các tham số bị viết cứng trong backend
- `GET /children`: `ChildType: "ACCOUNT"` cố định, nên không liệt kê được OU con.
- `GET /targets/:id/policies`: `Filter: "SERVICE_CONTROL_POLICY"` cố định.
- `GET /effective-policy`: `PolicyType: "SERVICE_CONTROL_POLICY"` cố định (AWS không hỗ trợ loại này) và bắt sai tên exception.
- `GET /policies`: không truyền `NextToken`. Mọi route list khác cũng bỏ qua phân trang.

### 15.6 🟠 Kiểu dữ liệu không khớp ở `GET /policies/:id`
Route trả về `result.Policy`, có dạng `{ PolicySummary: {...}, Content }`. Nhưng `useOrgPolicy` khai báo kiểu `OrgPolicy` phẳng (`Name`, `Id`…). Đây là cùng loại lỗi đã sửa ở #12; sẽ lộ ra khi làm trang chi tiết policy.

### 15.7 🟡 Hook và import thừa
`OrganizationsDashboard.tsx` import `useAttachOrgPolicy`, `useDetachOrgPolicy`, `useOrgPolicyTargets`, `useOrgTargetPolicies` nhưng không dùng. Trong `useOrganizations.ts` có 15 hook chưa được dùng ở đâu: `useEnableAllFeatures`, `useOrgOU`, `useUpdateOrgOU`, `useOrgParents`, `useOrgChildren`, `useOrgAccount`, `useMoveOrgAccount`, `useRemoveOrgAccount`, `useLeaveOrg`, `useOrgPolicy`, `useUpdateOrgPolicy`, `useOrgTags`, `useTagOrgResource`, `useUntagOrgResource`, cùng nhóm attach/detach ở trên.

## 16. Bảng đối chiếu API: Floci ↔ backend dashboard ↔ UI

| API | Floci | Route backend | UI |
|---|:-:|:-:|:-:|
| CreateOrganization / DescribeOrganization / DeleteOrganization | ✅ | ✅ | ✅ (xóa không xác nhận) |
| EnableAllFeatures | ✅ | ✅ | ❌ |
| ListRoots | ✅ | ✅ | ✅ |
| Create / Describe / Update / Delete OU | ✅ | ✅ | Chỉ Create (ở root) |
| ListOrganizationalUnitsForParent | ✅ | ✅ | Chỉ cấp 1 |
| ListParents / ListChildren | ✅ | ✅ (Children cố định ACCOUNT) | ❌ |
| CreateAccount / DescribeCreateAccountStatus / ListCreateAccountStatus | ✅ | ✅ | Chỉ Create |
| CreateGovCloudAccount | ✅ | ❌ | ❌ |
| DescribeAccount / ListAccounts / ListAccountsForParent | ✅ | ✅ | Chỉ ListAccountsForParent(root) |
| MoveAccount / RemoveAccountFromOrganization / LeaveOrganization / CloseAccount | ✅ | ✅ | ❌ (Close có code nhưng không hiện) |
| Create / Update / Delete / Describe / List Policy | ✅ | ✅ | Chỉ Create + List (SCP) |
| Attach / Detach Policy, ListPoliciesForTarget, ListTargetsForPolicy | ✅ | ✅ | ❌ |
| Enable / Disable PolicyType | ✅ | ✅ | ❌ |
| DescribeEffectivePolicy | ✅ | ⚠️ route sai | ❌ |
| ListAccountsWithInvalidEffectivePolicy | ✅ | ❌ | ❌ |
| Tag / Untag / ListTagsForResource | ✅ | ✅ | ❌ |
| Enable / Disable / List AWSServiceAccess | ✅ | ❌ | ❌ |
| Register / Deregister / List DelegatedAdministrator(s), ListDelegatedServicesForAccount | ✅ | ❌ | ❌ |
| Put / Describe / Delete ResourcePolicy | ✅ | ❌ | ❌ |
| InviteAccountToOrganization, Accept / Decline / Cancel / Describe Handshake, ListHandshakesFor* | ✅ | ❌ | ❌ |

## 17. Đề xuất thứ tự sửa

1. **Sửa lỗi 🔴 trước:** hiển thị cột hoặc nút xóa trong `ResourceTable` (hoặc dùng `DeleteButton` có sẵn); thêm xác nhận khi xóa org, OU, account; liệt kê account ở mọi cấp; bỏ tag `ParentId`.
2. **Trang AWS accounts dạng cây:** Hierarchy/List, checkbox, menu Actions (Create/Rename/Delete OU; Move/Remove/Close account), cột ngày tạo/tham gia, nhãn management account, ô tìm kiếm.
3. **Trang chi tiết** cho account, OU, root và policy, với tab Policies và Tags.
4. **Policies:** danh sách loại policy kèm Enable/Disable, tạo policy có description và tags và kiểm tra JSON, gắn/gỡ policy, effective policy (chỉ cho loại không phải SCP/RCP).
5. **Settings:** chi tiết organization, delete organization có gõ ID xác nhận, delegation policy.
6. **Invitations** và **Services** (cần thêm route backend).
7. Bỏ header bị lặp, chuyển toast sang Flashbar (tùy chọn).

## Nguồn
- AWS Organizations User Guide: [AWS accounts / navigate tree](https://docs.aws.amazon.com/organizations/latest/userguide/navigate_tree.html), [Create account](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_create.html), [Invite account](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_invite-account.html), [Invitations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_invites.html), [View account](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_view_account.html), [Remove account](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_remove.html), [Close account](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_close.html), [Move account](https://docs.aws.amazon.com/organizations/latest/userguide/move_account_to_ou.html), [Manage OUs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html), [Create OU](https://docs.aws.amazon.com/organizations/latest/userguide/create_ou.html), [Delete OU](https://docs.aws.amazon.com/organizations/latest/userguide/delete-ou.html), [View OU](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_view_ou.html), [View root](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_view_root.html), [Policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies.html), [Enable policy type](https://docs.aws.amazon.com/organizations/latest/userguide/enable-policy-type.html), [Create policy](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_create.html), [Attach policy](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_attach.html), [Policy info](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_info-operations.html), [Trusted access / Services](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_integrate_services.html), [View organization / Settings](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_view_org.html), [Delete organization](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_delete.html), [Delegated administrator](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_delegate_policies.html)
- Ảnh chụp console thật (2022): [matrixpost blog — AWS Organizations and Control Tower](https://blog.matrixpost.net/aws-organizations-and-control-tower/)
- Source Floci: `../floci/src/main/java/io/github/hectorvent/floci/services/organizations/OrganizationsJsonHandler.java`, `OrganizationsService.java`
