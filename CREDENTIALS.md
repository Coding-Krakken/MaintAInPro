# MaintAInPro CMMS - User Credentials

## 🔐 **Test Account Credentials**

All accounts are ready to use with the ACME Manufacturing Corp organization. Each user has different roles and permissions within the system.

---

## 📋 **Complete User List**

### **1. Super Admin**
- **Email:** `superadmin@acme.com`
- **Password:** `SuperAdmin123!`
- **Role:** Super Admin
- **Department:** Administration
- **Employee ID:** SA001
- **Access Level:** Full system access, all modules
- **Permissions:** All permissions (`*`)

### **2. Organization Admin**
- **Email:** `admin@acme.com`
- **Password:** `OrgAdmin123!`
- **Role:** Admin
- **Department:** Management
- **Employee ID:** OA001
- **Access Level:** All modules except system settings
- **Permissions:** 
  - Users: Read/Write
  - Work Orders: Read/Write
  - Equipment: Read/Write
  - Inventory: Read/Write
  - Reports: Read
  - Settings: Read/Write

### **3. Warehouse Manager**
- **Email:** `manager@acme.com`
- **Password:** `Manager123!`
- **Role:** Manager
- **Department:** Operations
- **Employee ID:** WM001
- **Access Level:** Work orders, equipment, inventory, reports
- **Permissions:**
  - Work Orders: Read/Write
  - Equipment: Read/Write
  - Inventory: Read/Write
  - Reports: Read
  - Vendors: Read

### **4. Maintenance Technician**
- **Email:** `technician@acme.com`
- **Password:** `Tech123!`
- **Role:** Technician
- **Department:** Maintenance
- **Employee ID:** MT001
- **Access Level:** Work orders, equipment, limited inventory
- **Permissions:**
  - Work Orders: Read/Write
  - Equipment: Read
  - Inventory: Read
  - Preventive Maintenance: Read/Write

### **5. Inventory Manager**
- **Email:** `inventory@acme.com`
- **Password:** `Inventory123!`
- **Role:** Inventory Manager
- **Department:** Inventory
- **Employee ID:** IM001
- **Access Level:** Inventory management, vendors, reports
- **Permissions:**
  - Inventory: Read/Write
  - Parts: Read/Write
  - Vendors: Read/Write
  - Reports: Read

### **6. Regular User/Viewer**
- **Email:** `user@acme.com`
- **Password:** `User123!`
- **Role:** User/Viewer
- **Department:** General
- **Employee ID:** RU001
- **Access Level:** Read-only access to most modules
- **Permissions:**
  - Work Orders: Read
  - Equipment: Read
  - Inventory: Read
  - Reports: Read

### **7. Maintenance Supervisor**
- **Email:** `supervisor@acme.com`
- **Password:** `Supervisor123!`
- **Role:** Supervisor
- **Department:** Maintenance
- **Employee ID:** MS001
- **Access Level:** WO assignments, PM schedules, dashboards
- **Permissions:**
  - Work Orders: Read/Write
  - Equipment: Read/Write
  - Preventive Maintenance: Read/Write
  - Reports: Read

### **8. Inventory Clerk**
- **Email:** `clerk@acme.com`
- **Password:** `Clerk123!`
- **Role:** Inventory Clerk
- **Department:** Inventory
- **Employee ID:** IC001
- **Access Level:** Parts management, stock levels
- **Permissions:**
  - Inventory: Read/Write
  - Parts: Read/Write

### **9. External Contractor**
- **Email:** `contractor@acme.com`
- **Password:** `Contractor123!`
- **Role:** Contractor
- **Department:** External
- **Employee ID:** EC001
- **Access Level:** View assigned work orders, upload photos
- **Permissions:**
  - Work Orders: Read/Write (assigned only)

### **10. Work Order Requester**
- **Email:** `requester@acme.com`
- **Password:** `Requester123!`
- **Role:** Requester
- **Department:** Production
- **Employee ID:** WR001
- **Access Level:** Submit work order requests, view own requests
- **Permissions:**
  - Work Orders: Create/Read Own

---

## 🏢 **Organization Information**

- **Organization Name:** ACME Manufacturing Corp
- **Organization Slug:** acme-manufacturing
- **Warehouse:** Main Warehouse (Code: WH001)
- **Address:** 123 Industrial Blvd, Manufacturing City, NY 12345
- **Subscription:** Enterprise (Active)

---

## 🔑 **Quick Reference Table**

| Email | Password | Role | Department | Primary Access |
|-------|----------|------|------------|---------------|
| superadmin@acme.com | SuperAdmin123! | Super Admin | Administration | Full System |
| admin@acme.com | OrgAdmin123! | Admin | Management | All Modules |
| manager@acme.com | Manager123! | Manager | Operations | WO/Equipment/Inventory |
| technician@acme.com | Tech123! | Technician | Maintenance | WO/Equipment |
| inventory@acme.com | Inventory123! | Inventory Manager | Inventory | Inventory/Parts/Vendors |
| user@acme.com | User123! | User/Viewer | General | Read-Only |
| supervisor@acme.com | Supervisor123! | Supervisor | Maintenance | WO/PM Management |
| clerk@acme.com | Clerk123! | Inventory Clerk | Inventory | Parts Management |
| contractor@acme.com | Contractor123! | Contractor | External | Assigned WO Only |
| requester@acme.com | Requester123! | Requester | Production | Create/View Own WO |

---

## 📝 **Role Descriptions**

### **Super Admin**
- Complete system administration
- User management across all organizations
- System configuration and settings
- Full access to all data and features

### **Admin**
- Organization-level administration
- User management within organization
- Access to all modules except system settings
- Can create and manage all organizational data

### **Manager**
- Department-level management
- Work order oversight and assignment
- Equipment and inventory management
- Access to reporting and analytics

### **Technician**
- Work order execution
- Equipment maintenance and updates
- Limited inventory access for parts usage
- Preventive maintenance task completion

### **Inventory Manager**
- Complete inventory control
- Parts catalog management
- Vendor relationship management
- Inventory reporting and analytics

### **User/Viewer**
- Read-only access to most modules
- Can view work orders, equipment, and inventory
- No modification permissions
- Basic reporting access

### **Supervisor**
- Work order assignment and tracking
- Preventive maintenance scheduling
- Team management and oversight
- Dashboard and reporting access

### **Inventory Clerk**
- Daily inventory operations
- Parts receiving and issuing
- Stock level monitoring
- Basic inventory transactions

### **Contractor**
- Limited external access
- Can only view assigned work orders
- Upload photos and completion documentation
- No access to internal systems

### **Requester**
- Work order creation
- View own submitted requests
- Track request status
- Basic user-level access

---

## 🚀 **Getting Started**

1. **Choose a user account** based on the role you want to test
2. **Navigate to** your application (usually `http://localhost:3000`)
3. **Login** with the email and password from the table above
4. **Explore** the features available to that specific role
5. **Test** different permissions and access levels

---

## 🔒 **Security Notes**

- All passwords follow the pattern: `[Role]123!`
- Users are automatically assigned to ACME Manufacturing Corp organization
- Row Level Security (RLS) is enabled to ensure data isolation
- Each user can only access data within their organization
- Permissions are enforced at both database and application levels

---

## 🛠️ **Database Setup**

These credentials are automatically created when you run:
```bash
node create-comprehensive-users.js
```

The script creates:
- Authentication users in Supabase Auth
- User profiles in the users table
- Proper organization and warehouse associations
- Appropriate role assignments and permissions

---

## 📞 **Support**

If you encounter login issues:
1. Verify the RLS policies are properly configured
2. Check that the user exists in both Auth and users table
3. Ensure the organization_id matches across all tables
4. Confirm the application environment variables are correct

---

**Last Updated:** July 14, 2025
**Database:** Supabase (Project: jthortssykpaodtbcnmq)
**Environment:** Development
