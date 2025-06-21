/**
 * Modernized Attachment module for Node.js 22 compatibility
 * Replaces the legacy JavaScript version with TypeScript and modern APIs
 */

import { generateMD5Hash } from '@/utils/crypto-utils';
import { trackEvent } from '@/utils/window';
import AP from '@/model/AP';

interface AttachmentMeta {
  attachmentId: string;
  versionNumber: number;
  hash: string;
}

interface AttachmentResponse {
  body: string;
  xhr?: {
    status: number;
  };
}

/**
 * Convert iframe content to PNG blob
 */
async function iframeToPng(iframe: HTMLIFrameElement): Promise<Blob> {
  return new Promise((resolve) => {
    const handleMessage = ({ source, data }: MessageEvent) => {
      if (source?.location?.href !== window.location.href && data?.action === 'export.result') {
        window.removeEventListener('message', handleMessage);
        resolve(data.data);
        console.debug('received PNG export result from iframe');
      }
    };

    window.addEventListener('message', handleMessage);
    iframe.contentWindow?.postMessage({ action: 'export' });
    console.debug('fired PNG export to iframe');
  });
}

/**
 * Convert DOM element to PNG blob using modern APIs
 */
async function elementToPng(): Promise<Blob> {
  try {
    // Try iframe export first
    const mainFrame = document.getElementById('mainFrame') as HTMLIFrameElement;
    if (mainFrame) {
      return await iframeToPng(mainFrame);
    }

    // Fallback to html-to-image
    const { toBlob } = await import('html-to-image');
    const node = document.getElementsByClassName('screen-capture-content')[0] as HTMLElement;
    
    if (!node) {
      throw new Error('No screen-capture-content element found');
    }

    const blob = await toBlob(node, { bgcolor: 'white' });
    if (!blob) {
      throw new Error('Failed to generate blob from element');
    }

    return blob;
  } catch (error) {
    console.error('Failed to convert to png', error);
    trackEvent(JSON.stringify(error), 'convert_to_png', 'error');
    throw error;
  } finally {
    trackEvent('toPng', 'convert_to_png', 'export');
  }
}

/**
 * Build attachment base path
 */
export function buildAttachmentBasePath(pageId: string): string {
  return `/rest/api/content/${pageId}/child/attachment`;
}

/**
 * Build GET request for attachments
 */
export function buildGetRequestForAttachments(pageId: string) {
  return {
    url: buildAttachmentBasePath(pageId) + '?expand=version',
    type: 'GET'
  };
}

/**
 * Parse attachments from API response
 */
export function parseAttachmentsFromResponse(response: AttachmentResponse) {
  return JSON.parse(response.body).results;
}

/**
 * Get all attachments for a page
 */
async function getAttachments(pageId: string) {
  trackEvent(pageId, 'get_attachments', 'before_request');
  const response = await AP.request(buildGetRequestForAttachments(pageId));
  trackEvent(response?.xhr?.status?.toString() || 'unknown', 'get_attachments', 'after_request');
  return parseAttachmentsFromResponse(response);
}

/**
 * Build POST request to upload attachment
 */
function buildPostRequestToUploadAttachment(uri: string, hash: string, file: File) {
  return {
    url: uri,
    type: 'POST',
    contentType: 'multipart/form-data',
    data: { minorEdit: true, comment: hash, file }
  };
}

/**
 * Upload attachment file
 */
async function uploadAttachment(attachmentName: string, uri: string, hash: string) {
  const blob = await elementToPng();
  const file = new File([blob], attachmentName, { type: 'image/png' });
  console.debug('Uploading attachment to', uri);
  return await AP.request(buildPostRequestToUploadAttachment(uri, hash, file));
}

/**
 * Build PUT request to update attachment properties
 */
function buildPutRequestToUpdateAttachmentProperties(
  pageId: string, 
  attachmentId: string, 
  versionNumber: number, 
  hash: string
) {
  return {
    url: buildAttachmentBasePath(pageId) + '/' + attachmentId,
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({
      minorEdit: true,
      id: attachmentId,
      type: 'attachment',
      version: { number: versionNumber },
      metadata: { comment: hash }
    })
  };
}

/**
 * Get URL parameter value
 */
function getUrlParam(param: string): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || '';
}

/**
 * Try to get existing attachment
 */
async function tryGetAttachment() {
  const pageId = getUrlParam("pageId");
  const attachments = await getAttachments(pageId);
  const attachmentName = 'zenuml-' + getUrlParam("uuid") + '.png';
  return attachments.find((a: any) => a.title === attachmentName);
}

/**
 * Upload attachment with URI generator function
 */
async function uploadAttachment2(hash: string, fnGetUri: (pageId: string) => string) {
  const pageId = getUrlParam("pageId");
  const attachmentName = 'zenuml-' + getUrlParam("uuid") + '.png';
  const uri = fnGetUri(pageId);
  return await uploadAttachment(attachmentName, uri, hash);
}

/**
 * Upload new version of existing attachment
 */
function uploadNewVersionOfAttachment(hash: string) {
  return async (): Promise<AttachmentMeta> => {
    const attachment = await tryGetAttachment();
    const attachmentId = attachment.id;
    const versionNumber = attachment.version.number + 1;
    trackEvent('uploadNewVersionOfAttachment' + versionNumber, 'upload_attachment', 'export');
    
    await uploadAttachment2(hash, (pageId) => {
      return buildAttachmentBasePath(pageId) + '/' + attachmentId + '/data';
    });
    
    return { attachmentId, versionNumber, hash };
  };
}

/**
 * Upload new attachment
 */
function uploadNewAttachment(hash: string) {
  return async (): Promise<AttachmentMeta> => {
    trackEvent('uploadNewAttachment', 'upload_attachment', 'export');
    const response = await uploadAttachment2(hash, buildAttachmentBasePath);
    const attachmentId = JSON.parse(response.body).results[0].id;
    const versionNumber = 1;
    return { attachmentId, versionNumber, hash };
  };
}

/**
 * Update attachment properties
 */
async function updateAttachmentProperties(attachmentMeta: AttachmentMeta) {
  const pageId = getUrlParam("pageId");
  await AP.request(buildPutRequestToUpdateAttachmentProperties(
    pageId,
    attachmentMeta.attachmentId, 
    attachmentMeta.versionNumber, 
    attachmentMeta.hash
  ));
}

/**
 * Create attachment if content has changed
 * Main export function that replaces the default export from the JS version
 */
export default async function createAttachmentIfContentChanged(content: string): Promise<void> {
  console.debug('Attachment.ts - Checking attachment for code:', content);
  
  const attachment = await tryGetAttachment();
  const hash = generateMD5Hash(content);
  
  if (!attachment || hash !== attachment.metadata.comment) {
    const uploadFn = attachment 
      ? uploadNewVersionOfAttachment(hash) 
      : uploadNewAttachment(hash);
    
    const attachmentMeta = await uploadFn();
    await updateAttachmentProperties(attachmentMeta);
  }
}