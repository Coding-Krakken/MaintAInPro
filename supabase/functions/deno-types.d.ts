// This file tells TypeScript to ignore Deno-specific code
// @ts-nocheck

// Deno global declarations
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };

  const serve: (
    handler: (request: Request) => Response | Promise<Response>
  ) => void;
  const createClient: (url: string, key: string) => any;
}

export {};
