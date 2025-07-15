import { http, HttpResponse } from 'msw';

// Mock handlers for Supabase API
export const handlers = [
  // Auth handlers
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    });
  }),

  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    });
  }),

  // Database handlers
  http.get('*/rest/v1/work_orders', () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Test Work Order',
        description: 'Test Description',
        status: 'open',
        priority: 'medium',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ]);
  }),

  http.get('*/rest/v1/equipment', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Test Equipment',
        type: 'machinery',
        status: 'operational',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ]);
  }),

  http.get('*/rest/v1/inventory', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Test Part',
        quantity: 100,
        unit: 'pcs',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ]);
  }),

  // Catch-all handler for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.error();
  }),
];
