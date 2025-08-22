/**
 * Manifest API Handler for Vercel
 * Serves the web app manifest with correct MIME type and headers
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set CORS and cache headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Try multiple possible paths for the manifest file
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'public', 'manifest.json'),
      path.join(process.cwd(), 'client', 'public', 'manifest.json'),
      path.join(__dirname, '..', 'dist', 'public', 'manifest.json'),
      path.join(__dirname, '..', 'client', 'public', 'manifest.json')
    ];
    
    let manifestPath = null;
    let manifestContent = null;
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        manifestPath = testPath;
        manifestContent = fs.readFileSync(testPath, 'utf-8');
        break;
      }
    }
    
    console.log('Serving manifest from:', manifestPath);
    
    if (manifestContent) {
      return res.status(200).send(manifestContent);
    } else {
      // Fallback manifest for PWA compatibility
      const fallbackManifest = {
        name: "MaintAInPro",
        short_name: "MaintAIn",
        description: "Computerized Maintenance Management System",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png", 
            sizes: "512x512",
            type: "image/png"
          }
        ]
      };
      
      console.log('Using fallback manifest');
      return res.status(200).json(fallbackManifest);
    }
  } catch (error) {
    console.error('Error serving manifest:', error);
    
    // Return a basic fallback manifest even on error
    const errorManifest = {
      name: "MaintAInPro",
      short_name: "MaintAIn",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000"
    };
    
    return res.status(200).json(errorManifest);
  }
}