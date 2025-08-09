**Parts & Inventory Management Module**

---

**Purpose:** Track, consume, reorder, and receive all maintenance parts across
work orders. Includes support for ASN, PO workflows, vendor integration
(Siggins), and part usage tracking.

---

**1. Core Features:**

- Live quantity tracking of parts
- Part linking to WO and asset models
- ASN intake with PO validation
- Vendor integration with support for automated emails
- Transaction logs for every inventory event

---

**2. Part Fields:**

- id (UUID)
- part_number (Text) → e.g., HYT106.0432
- original_number (Text) → e.g., 106.0432
- description (Text)
- vendor_id (UUID)
- quantity_on_hand (Integer)
- reorder_point (Integer)
- model_compatibility (Array of model names)
- default_bin (Text)
- warehouse_id (UUID FK) - Multi-warehouse inventory tracking

---

**3. ASN Receipt Fields:**

- id (UUID)
- asn_number (Text)
- po_number (Text)
- parts\[] (Array of part_id + qty)
- received_by (UserRef)
- status (Enum: new, verified, completed)
- date_received (Date)

---

**4. Part Transaction Log:**

- id (UUID)
- part_id (UUID)
- work_order_id (optional UUID)
- type (Enum: inbound, used, adjustment)
- quantity (Integer)
- performed_by (UserRef)
- timestamp (DateTime)

---

**5. WO Integration:**

- Technician selects part(s) during WO completion
- System decrements quantity and logs transaction
- Alert if stock is below reorder_point
- Notifications sent to inventory clerks for low stock
- Cross-warehouse part lookup (if user has multi-site access)

---

**6. Reorder Automation:**

- List of low-stock parts
- Auto-generate email order drafts (for Siggins)
- Include PO#, ASN#, and part lines
- Configurable format per vendor

---

**7. Mobile Features:**

- Scan-to-add part usage
- View part bin and live qty
- Log adjustments (e.g., loss, damage)
- Receive ASN from dock with quantity check
