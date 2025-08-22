**Work Order Management Module**

---

**Purpose:** Track, assign, execute, and verify maintenance-related work orders
for assets across the warehouse. Includes support for mobile-first use,
role-based workflow, and detailed task tracking.

---

**1. Core Features:**

- Manual and system-generated work orders (PM or corrective)
- Lifecycle tracking: New → Assigned → In Progress → Completed → Verified →
  Closed
- Assignment of technician(s) or external contractors
- Real-time progress updates, labor logging, part usage, and notes
- Upload support for images and audio
- Escalation and follow-up capabilities

---

**2. Work Order Fields:**

- id (UUID)
- fo_number (Text)
- type (Enum: PM, Corrective, Emergency)
- description (Text)
- area (Text)
- asset_model (Text)
- status (Enum)
- priority (Enum)
- requested_by (User ID)
- assigned_to (Array of User IDs)
- created_at (Timestamp)
- due_date (Date)
- completed_at (Timestamp)
- verified_by (User ID)
- time_logs (Array of labor entries)
- checklist_items (Array of task items)
- attachments (Array of file URLs)
- follow_up (Boolean)
- parts_used (Array of part references)
- warehouse_id (UUID FK) - Multi-warehouse support
- escalated (Boolean, default false)
- escalation_level (Integer, default 0)
- last_updated (Timestamp) - For escalation tracking

---

**3. Checklist Items:** Each WO can contain multiple component-action pairs
(especially for PM WOs).

- Component: e.g., Motor, Reducer
- Action: e.g., Check Noise, Check Mounting Bolts
- Status: Done / Skipped / Issue
- Notes / Attachments

---

**4. Mobile UI:**

- Simple card-based layout of assigned WOs
- One-click status changes
- Voice-to-text for notes
- Scan QR code to pull FO# / Asset
- Upload image via phone camera with compression (max 5MB)
- Checklist UI with toggles, notes, and file support
- File type validation and metadata storage
- Offline-first caching via IndexedDB
- Background sync when reconnected
- Conflict resolution for parallel updates

---

**4.1. Offline Mode Support:**

- Cache WOs and checklists locally using IndexedDB
- Queue updates for sync when online
- Visual indicators for offline/sync status
- Conflict resolution logic:
  - Timestamp-based merging for non-conflicting fields
  - User prompt for conflicting status changes
  - Automatic merge for additive data (notes, attachments)

---

**4.2. Auto-Escalation Logic:**

- Configurable escalation rules per WO type/priority
- Default: WO not updated in 24 hours → notify supervisor
- Emergency WOs escalate after 4 hours
- Use background services or scheduled jobs for periodic evaluation
- Escalation triggers:
  - Send notification to supervisor/manager
  - Increment escalation_level
  - Set escalated flag to true
  - Log escalation event in system_logs

---

**4.3. Notification Integration:**

- Auto-generate notifications for:
  - New WO assignment → technician
  - WO escalation → supervisor
  - WO completion → requester
  - Overdue WO → supervisor
- Real-time updates via WebSocket connections

---

**5. User Roles and Access:**

- Technician: Assigned WOs only, can update status and add parts/labor
- Supervisor: Can assign, verify, and edit WOs
- Manager: Full access
- Contractor: Can view assigned WOs and upload updates
