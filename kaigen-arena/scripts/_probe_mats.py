import json, struct, numpy as np, sys

def load(p):
    d = open(p, "rb").read(); off = 12; js = None; binb = None
    while off < len(d):
        ln, ty = struct.unpack_from("<I4s", d, off); off += 8
        if ty == b"JSON": js = json.loads(d[off:off + ln].decode("utf-8"))
        elif ty == b"BIN\x00": binb = d[off:off + ln]
        off += ln + (ln % 4 and 4 - ln % 4 or 0)
    return js, binb

j, b = load(sys.argv[1])
mat_names = [m.get("name") for m in j["materials"]]
for mi, m in enumerate(j["meshes"]):
    for pr in m["primitives"]:
        a = j["accessors"][pr["attributes"]["POSITION"]]
        bv = j["bufferViews"][a["bufferView"]]
        o = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
        pos = np.frombuffer(b, dtype="<f4", count=a["count"] * 3, offset=o).reshape(-1, 3)
        mn = [n for n in j["nodes"] if n.get("mesh") == j["meshes"].index(m)]
        s = np.array(mn[0].get("scale", [1, 1, 1])) if mn else np.ones(3)
        pos = pos * s
        name = mat_names[pr.get("material", -1)] if "material" in pr else "none"
        print("%-12s verts %5d y[%+.2f,%+.2f] z[%+.2f,%+.2f]" % (
            name, a["count"], pos[:, 1].min(), pos[:, 1].max(), pos[:, 2].min(), pos[:, 2].max()))
