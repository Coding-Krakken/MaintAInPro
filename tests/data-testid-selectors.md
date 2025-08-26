# Data-TestID Selectors Required by Main-Flow Tests

This document lists all the data-testid selectors that are expected by the main-flow E2E tests. These need to be implemented in the corresponding UI components.

## Authentication Related Selectors

- `email-input` - Email input field in login form
- `password-input` - Password input field in login form
- `login-button` - Login form submit button
- `logout-button` - Logout button in user menu
- `user-menu-button` - Button to open user menu dropdown
- `user-name` - Display of current user's name
- `register-link` - Link to registration page
- `remember-me-checkbox` - Remember me checkbox in login form
- `password-strength` - Password strength indicator
- `error-message` - Error message display container

## Work Order Management Selectors

- `nav-work-orders` - Navigation link to work orders page
- `work-order-list` - Container for work order list
- `work-order-card` - Individual work order card component
- `work-order-chart` - Dashboard chart for work orders
- `create-work-order-button` - Button to create new work order
- `fo-number-input` - Field Operations number input
- `description-input` - Work order description input
- `priority-select` - Priority selection dropdown
- `status-select` - Status selection dropdown
- `status-badge` - Display of current status
- `status-filter` - Filter dropdown for status
- `update-status-button` - Button to update work order status
- `complete-button` - Button to complete work order
- `notes-input` - Notes input field
- `add-note-button` - Button to add notes
- `add-parts-button` - Button to add parts to work order
- `part-search` - Parts search input
- `part-select` - Parts selection dropdown
- `quantity-input` - Quantity input for parts
- `confirm-parts-button` - Button to confirm parts addition

## Equipment Management Selectors

- `nav-equipment` - Navigation link to equipment page
- `equipment-card` - Individual equipment card component
- `equipment-chart` - Dashboard chart for equipment
- `create-equipment-button` - Button to create new equipment
- `equipment-name-input` - Equipment name input field
- `equipment-model-input` - Equipment model input field
- `equipment-select` - Equipment selection dropdown
- `equipment-option` - Options within equipment dropdown
- `serial-number-input` - Serial number input field
- `location-input` - Location input field
- `submit-equipment-button` - Button to submit equipment form
- `qr-scan-button` - Button to start QR code scanning
- `qr-scanner` - QR code scanner component

## Dashboard Analytics Selectors

- `total-work-orders` - Total work orders metric display
- `pending-work-orders` - Pending work orders metric display
- `completed-work-orders` - Completed work orders metric display
- `active-equipment` - Active equipment metric display
- `date-range-picker` - Date range picker component
- `date-range-30-days` - 30 days option in date picker
- `date-range-display` - Current date range display

## Mobile and Responsive Selectors

- `mobile-menu-button` - Mobile hamburger menu button
- `mobile-nav-dashboard` - Mobile navigation dashboard link
- `mobile-nav-work-orders` - Mobile navigation work orders link
- `mobile-nav-equipment` - Mobile navigation equipment link

## Search and Filtering Selectors

- `search-input` - Global search input field
- `search-results` - Search results container

## Performance and UX Selectors

- `loading-indicator` - Loading spinner or indicator
- `success-message` - Success message display
- `pagination` - Pagination controls
- `virtual-scroll-container` - Virtual scrolling container
- `load-more-button` - Load more items button

## Offline and Sync Selectors

- `offline-indicator` - Offline status indicator
- `sync-queue-indicator` - Sync queue status indicator

## Implementation Notes

1. All selectors should be implemented as `data-testid` attributes in the corresponding React components
2. Selectors should be stable and not change based on dynamic content
3. Use semantic, descriptive names that clearly indicate the element's purpose
4. Ensure selectors are unique within their scope/page
5. Consider adding TypeScript types for data-testid values to prevent typos

## Example Implementation

```tsx
// Example: Login form component
<form>
  <input 
    data-testid="email-input"
    type="email" 
    placeholder="Email"
  />
  <input 
    data-testid="password-input"
    type="password" 
    placeholder="Password"
  />
  <button data-testid="login-button">
    Login
  </button>
</form>
```

## Testing Commands

To validate that selectors are properly implemented:

```bash
# Run main-flow E2E tests
npm run test:e2e -- tests/e2e/main-flows.spec.ts

# Run all E2E tests
npm run test:e2e

# Run with debug mode
npm run test:e2e:debug -- tests/e2e/main-flows.spec.ts
```