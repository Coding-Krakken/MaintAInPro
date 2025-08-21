# Functional Requirements Document (FRD)

This document defines the functional requirements for MaintAInPro CMMS.

## Overview
MaintAInPro is an enterprise-grade CMMS for managing work orders, preventive maintenance, equipment assets, parts inventory, vendor contracts, and system configuration. Stakeholders include maintenance managers, technicians, inventory staff, and system administrators.

## User Stories / Use Cases
- As a maintenance manager, I want to create, assign, and track work orders so that maintenance tasks are completed efficiently.
- As a technician, I want to view my assigned work orders and update their status so that progress is visible to management.
- As an inventory staff member, I want to manage parts inventory so that required parts are available for maintenance.
- As a system administrator, I want to configure user roles and permissions so that access is secure and appropriate.

## Functional Requirements
| ID   | Description                                              | Priority | Acceptance Criteria                       |
|------|----------------------------------------------------------|----------|--------------------------------------------|
| FR-1 | Work order creation, assignment, and tracking            | Must     | Users can create, assign, and update work orders |
| FR-2 | Preventive maintenance scheduling and tracking           | Must     | Users can schedule and track PM tasks      |
| FR-3 | Equipment asset management                               | Must     | Users can add, edit, and view equipment assets |
| FR-4 | Parts inventory management                               | Must     | Users can add, edit, and track inventory  |
| FR-5 | Vendor and contractor management                         | Should   | Users can manage vendor/contractor records |
| FR-6 | System configuration and role-based access control       | Must     | Admins can configure system and permissions |
| FR-7 | Audit logging and compliance reporting                   | Must     | All changes are logged and reports are available |

## Dependencies
- PostgreSQL database
- Express.js backend
- React frontend
- Drizzle ORM

## References
- See ADRs and RFCs in /artifacts/ for architectural decisions and feature proposals.
