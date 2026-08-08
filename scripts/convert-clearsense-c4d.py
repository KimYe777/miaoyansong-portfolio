"""Convert the approved ClearSense Rhino source to a web GLB with Cinema 4D.

Run with Cinema 4D's c4dpy executable. The source is never modified.
"""

import json
import os
import sys

import c4d
from c4d import documents


def walk_objects(node):
    while node:
        yield node
        child = node.GetDown()
        if child:
            yield from walk_objects(child)
        node = node.GetNext()


def main():
    if len(sys.argv) < 3:
        raise SystemExit("usage: c4dpy convert-clearsense-c4d.py SOURCE.3dm OUTPUT.glb")

    source = os.path.abspath(sys.argv[-2])
    output = os.path.abspath(sys.argv[-1])
    flags = c4d.SCENEFILTER_OBJECTS | c4d.SCENEFILTER_MATERIALS
    document = documents.LoadDocument(source, flags)
    if document is None:
        raise RuntimeError(f"Cinema 4D could not load {source}")

    objects = list(walk_objects(document.GetFirstObject()))
    report = {
        "source": source,
        "objectCount": len(objects),
        "objects": [
            {
                "name": obj.GetName(),
                "type": obj.GetTypeName(),
                "position": [obj.GetAbsPos().x, obj.GetAbsPos().y, obj.GetAbsPos().z],
            }
            for obj in objects
        ],
        "gltfConstants": [name for name in dir(c4d) if "GLTF" in name.upper()],
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))

    format_id = getattr(c4d, "FORMAT_GLTFEXPORT", None)
    if format_id is None:
        raise RuntimeError("Cinema 4D does not expose FORMAT_GLTFEXPORT")

    os.makedirs(os.path.dirname(output), exist_ok=True)
    saved = documents.SaveDocument(
        document,
        output,
        c4d.SAVEDOCUMENTFLAGS_DONTADDTORECENTLIST,
        format_id,
    )
    if not saved:
        raise RuntimeError(f"Cinema 4D could not export {output}")
    print(json.dumps({"output": output, "bytes": os.path.getsize(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
