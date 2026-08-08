"""Rhino-side exporter for the approved ClearSense model.

Rhino opens the source document before this script runs. The source document is
never saved. Export output is written into the portfolio's static asset folder.
"""

import os
import traceback

import Rhino
import scriptcontext as sc


OUTPUT = r"D:\Codex_Workspace\projects\个人作品集网站\public\assets\models\clearsense.glb"
LOG = r"D:\Codex_Workspace\projects\个人作品集网站\tmp\rhino-export.log"


def main():
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    try:
        with open(LOG, "w", encoding="utf-8") as log:
            log.write("started\n")
            log.write("doc={} objects={}\n".format(sc.doc.Name, sc.doc.Objects.Count))
        options = Rhino.FileIO.FileGltfWriteOptions()
        options.CullBackfaces = False
        options.ExportLayers = False
        options.ExportMaterials = True
        options.ExportOpenMeshes = True
        options.ExportTextureCoordinates = True
        options.ExportVertexColors = True
        options.ExportVertexNormals = True
        options.MapZToY = True
        options.UseDisplayColorForUnsetMaterials = True
        options.UseDracoCompression = False
        exported = Rhino.FileIO.FileGltf.Write(OUTPUT, sc.doc, options)
        with open(LOG, "a", encoding="utf-8") as log:
            log.write("exported={} exists={} bytes={}\n".format(
                exported,
                os.path.exists(OUTPUT),
                os.path.getsize(OUTPUT) if os.path.exists(OUTPUT) else 0,
            ))
    except Exception:
        with open(LOG, "a", encoding="utf-8") as log:
            log.write(traceback.format_exc())
    finally:
        Rhino.RhinoApp.Exit(False)


if __name__ == "__main__":
    main()
