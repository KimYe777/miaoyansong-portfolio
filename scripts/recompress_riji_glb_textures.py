import io
import json
import struct
import sys
from pathlib import Path

from PIL import Image


source = Path(sys.argv[1])
target = Path(sys.argv[2])
raw = source.read_bytes()
json_length, json_type = struct.unpack_from("<II", raw, 12)
document = json.loads(raw[20:20 + json_length])
bin_header = 20 + json_length
bin_length, bin_type = struct.unpack_from("<II", raw, bin_header)
binary = raw[bin_header + 8:bin_header + 8 + bin_length]

chunks = []
offset = 0


def append(data: bytes):
    global offset
    pad = (-offset) % 4
    if pad:
        chunks.append(b"\0" * pad)
        offset += pad
    start = offset
    chunks.append(data)
    offset += len(data)
    return start, len(data)


for view in document["bufferViews"][:4]:
    start = view.get("byteOffset", 0)
    view["byteOffset"], view["byteLength"] = append(binary[start:start + view["byteLength"]])

for index, image_info in enumerate(document["images"]):
    view = document["bufferViews"][image_info["bufferView"]]
    start = view.get("byteOffset", 0)
    image = Image.open(io.BytesIO(binary[start:start + view["byteLength"]])).convert("RGB")
    if max(image.size) > 2048:
        image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, "WEBP", quality=86 if index == 0 else 84, method=6)
    view["byteOffset"], view["byteLength"] = append(buffer.getvalue())
    image_info["mimeType"] = "image/webp"

new_binary = b"".join(chunks)
document["buffers"][0]["byteLength"] = len(new_binary)
json_bytes = json.dumps(document, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
json_bytes += b" " * ((-len(json_bytes)) % 4)
new_binary += b"\0" * ((-len(new_binary)) % 4)
total = 12 + 8 + len(json_bytes) + 8 + len(new_binary)
output = bytearray(struct.pack("<4sII", b"glTF", 2, total))
output += struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
output += struct.pack("<II", len(new_binary), 0x004E4942) + new_binary
target.write_bytes(output)
print(json.dumps({"bytes": len(output), "images": len(document["images"])}, ensure_ascii=False))
