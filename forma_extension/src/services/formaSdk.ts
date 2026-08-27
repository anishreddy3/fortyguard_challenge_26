/**
 * Autodesk Forma SDK Bridge Service.
 *
 * Facilitates bidirectional communication between the extension iframe and the
 * host Autodesk Forma 3D design canvas:
 * 1. Bounding Box & Camera extraction: Extracts the active urban design viewport.
 * 2. Geometry Actuation: Commits generative tree canopies, shade sails, and high-albedo materials.
 */

import { FormaBoundingBox, FormaActuatorPayload, FormaElement } from '../types/forma';

// Check if running within Autodesk Forma iframe context
export const isInsideFormaIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

/**
 * Extracts current 3D viewport bounding box from Autodesk Forma.
 * Uses official Forma Embedded SDK with intelligent fallback for standalone dev/testing.
 */
export async function getFormaCanvasBoundingBox(): Promise<FormaBoundingBox> {
  // If running inside Autodesk Forma with official SDK injected
  if (typeof (window as any).Forma !== 'undefined' && (window as any).Forma.geometry) {
    try {
      const forma = (window as any).Forma;
      // Get current proposal elements or active camera frustum footprint
      const selection = await forma.selection.getSelection();
      if (selection && selection.length > 0) {
        const bbox = await forma.geometry.getBbox({ paths: selection });
        return {
          min_x: bbox.min.x,
          min_y: bbox.min.y,
          max_x: bbox.max.x,
          max_y: bbox.max.y,
          elevation_min: bbox.min.z || 0.0,
          elevation_max: bbox.max.z || 45.0,
          crs: 'EPSG:3857',
        };
      }

      // Default to active project terrain bounds if no selection
      const projectBounds = await forma.project.getBounds();
      if (projectBounds) {
        return {
          min_x: projectBounds.min.x,
          min_y: projectBounds.min.y,
          max_x: projectBounds.max.x,
          max_y: projectBounds.max.y,
          elevation_min: 0.0,
          elevation_max: 50.0,
          crs: 'EPSG:3857',
        };
      }
    } catch (err) {
      console.warn('[FormaGuard] Forma SDK geometry lookup error, utilizing frame fallback:', err);
    }
  }

  // Standalone / Simulation Preset: Phoenix Downtown Innovation District / Dubai Marina
  return {
    min_x: 394200.0,
    min_y: 3701400.0,
    max_x: 394550.0,
    max_y: 3701750.0,
    elevation_min: 330.0,
    elevation_max: 375.0,
    crs: 'EPSG:32612 (UTM 12N)',
  };
}

/**
 * Commits generated mitigation geometry onto the active Autodesk Forma canvas.
 *
 * @param payload - FormaActuatorPayload containing array of FormaElements, transforms, and shaders.
 */
export async function commitGeometryToForma(payload: FormaActuatorPayload): Promise<{
  success: boolean;
  insertedCount: number;
  message: string;
}> {
  console.log('[FormaGuard] Committing mitigation geometry to Autodesk Forma canvas:', payload);

  // 1. Check for injected Forma SDK
  if (typeof (window as any).Forma !== 'undefined' && (window as any).Forma.render) {
    try {
      const forma = (window as any).Forma;

      // Group elements into batch
      const geometriesToRender = payload.elements.map((el: FormaElement) => ({
        id: el.urn,
        name: el.name,
        transform: el.transform_matrix,
        geometry: el.geometry,
        properties: el.properties,
      }));

      // Call Autodesk Forma Geometry rendering API
      if (forma.render.addGeometryBatch) {
        await forma.render.addGeometryBatch({ geometries: geometriesToRender });
      } else if (forma.render.addGeometry) {
        for (const geom of geometriesToRender) {
          await forma.render.addGeometry(geom);
        }
      }

      // Notify Forma project state update
      if (forma.proposal && forma.proposal.notifyUpdate) {
        await forma.proposal.notifyUpdate();
      }

      return {
        success: true,
        insertedCount: payload.elements.length,
        message: `Successfully rendered ${payload.elements.length} bioclimatic entities to Autodesk Forma.`,
      };
    } catch (error) {
      console.error('[FormaGuard] Failed to commit geometry to Autodesk Forma:', error);
      throw new Error(`Autodesk Forma Canvas integration failed: ${(error as Error).message}`);
    }
  }

  // 2. Fallback PostMessage Protocol for Web Components / Custom Embedded Views
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'FORMAGUARD_RENDER_MITIGATION_GEOMETRY',
        source: 'formaguard-extension',
        payload: payload,
      },
      '*'
    );
  }

  // Standalone simulation acknowledgement
  return {
    success: true,
    insertedCount: payload.elements.length,
    message: `Simulated insertion: ${payload.elements.length} mitigation assets (trees, shade sails, cool albedo) staged for canvas.`,
  };
}
