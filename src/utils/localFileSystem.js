import { get, set } from 'idb-keyval';
import { apiFetch } from './api';

/**
 * Utility for Browser File System Access API
 * Manages Obsidian Vault interaction locally.
 */

const HANDLE_KEY = 'obsidian-vault-handle';

/** 
 * Server Bridge API (Universal Support)
 * Works in Firefox/Safari by proxying through local node server.
 */
function getTargetBridgeServer(configuredUrl, filePath) {
  // If user is trying to access a local Windows/Unix absolute path, 
  // but their server is set to the Cloud (Render), we MUST redirect to localhost.
  const isLocalPath = /^[a-zA-Z]:\\|^[a-zA-Z]:\/|^\//.test(filePath);
  const isCloudServer = configuredUrl?.includes("onrender.com");
  
  if (isLocalPath && (isCloudServer || !configuredUrl)) {
    return "http://localhost:3847";
  }
  
  return configuredUrl || "http://localhost:3847";
}

export async function readLocalBridge(serverUrl, path) {
  const targetServer = getTargetBridgeServer(serverUrl, path);
  console.log(`[FS] Bridge Routing: ${path} -> ${targetServer}`);
  
  const res = await apiFetch(targetServer, "/api/local-vault/read", {
    method: "POST",
    body: JSON.stringify({ path })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned ${res.status}`);
  }
  const data = await res.json();
  return data.content;
}

export async function writeLocalBridge(serverUrl, path, content) {
  const targetServer = getTargetBridgeServer(serverUrl, path);
  const res = await apiFetch(targetServer, "/api/local-vault/write", {
    method: "POST",
    body: JSON.stringify({ path, content })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned ${res.status}`);
  }
  return true;
}

export async function uploadLocalBridge(serverUrl, vaultDir, filename, blob) {
  const targetServer = getTargetBridgeServer(serverUrl, vaultDir);
  // Convert blob to base64 for transmission
  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });

  const res = await apiFetch(targetServer, "/api/local-vault/upload", {
    method: "POST",
    body: JSON.stringify({ vaultDir, filename, base64Data })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned ${res.status}`);
  }
  return await res.json();
}

/** Request folder access and store handle (Chromium Only) */
export async function pickVaultFolder() {
  if (!window.showDirectoryPicker) {
    throw new Error("Your browser does not support the File System Access API. Please use a Chromium-based browser like Chrome or Edge for local vault access.");
  }
  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });
    await set(HANDLE_KEY, handle);
    return handle;
  } catch (e) {
    if (e.name === 'AbortError') return null; // User cancelled
    console.error("[FS] Folder picker failed:", e);
    throw e;
  }
}

/** Retrieve stored handle and verify permissions */
export async function getVaultHandle() {
  const handle = await get(HANDLE_KEY);
  if (!handle) return null;

  // Check if we still have permission
  const options = { mode: 'readwrite' };
  if ((await handle.queryPermission(options)) === 'granted') {
    return handle;
  }
  
  // Return handle even if not granted, caller will need to requestPermission()
  return handle;
}

/** Deep search for markdown files in the handle */
export async function listMarkdownFiles(dirHandle, path = "") {
  const files = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.md')) {
      files.push({ handle: entry, name: entry.name, path: `${path}${entry.name}` });
    } else if (entry.kind === 'directory') {
      const subFiles = await listMarkdownFiles(entry, `${path}${entry.name}/`);
      files.push(...subFiles);
    }
  }
  return files;
}

/** Read file content from a file handle */
export async function readFile(fileHandle) {
  const file = await fileHandle.getFile();
  return await file.text();
}

/** Write content to a file handle */
export async function writeFile(fileHandle, content) {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/** Write image to attachments/ folder */
export async function saveAttachment(vaultHandle, blob, filename) {
  try {
    // 1. Get or create attachments folder
    const attachmentsDir = await vaultHandle.getDirectoryHandle('attachments', { create: true });
    
    // 2. Create file
    const fileHandle = await attachmentsDir.getFileHandle(filename, { create: true });
    
    // 3. Write
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    
    return `attachments/${filename}`;
  } catch (e) {
    console.error("[FS] Attachment Save Failed:", e);
    throw e;
  }
}
