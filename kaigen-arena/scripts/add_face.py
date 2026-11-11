# Adds stylised face geometry (eyes, brows, mouth) to the Quaternius commuter heads.
# The pack ships faceless ovoids with degenerate UVs (every vertex at (0,1)), so painted
# face textures cannot land: rigid face parts weighted 1.0 to the Head joint are the
# mobile-cheap fix (3 tiny prims per character, no extra draw-call churn beyond materials).
# Also assigns a distinct skin tone per character. Run BEFORE fix_leg_hierarchy.py on a
# fresh import (this only touches mesh/materials, so either order works on an existing tree).
import json, struct, sys
import numpy as np

ROOT = r"C:\Users\angga\XiaomiMiMoProjects\WNI Pejuang Nafkah\kaigen-arena"
# linear baseColorFactor (glTF factors are LINEAR): distinct Indonesian skin tones per character
SKIN_TONES = {
    "female_commuter": [0.42, 0.255, 0.135, 1.0],
    "male_casual": [0.30, 0.165, 0.085, 1.0],
    "male_hoodie": [0.37, 0.215, 0.115, 1.0],
    "female_hijab": [0.46, 0.30, 0.175, 1.0],
}

def load_glb(path):
    with open(path, "rb") as f:
        magic, ver, total = struct.unpack("<III", f.read(12))
        js, binb = None, b""
        while f.tell() < total:
            clen, ctype = struct.unpack("<II", f.read(8))
            data = f.read(clen)
            if ctype == 0x4E4F534A:
                js = json.loads(data)
            elif ctype == 0x004E4942:
                binb = data
    return js, bytearray(binb)

def save_glb(path, js, binb):
    while len(binb) % 4:
        binb.append(0)
    jb = json.dumps(js, separators=(",", ":")).encode("utf-8")
    jb += b" " * ((4 - len(jb) % 4) % 4)
    blob = b"glTF" + struct.pack("<II", 2, 12 + 8 + len(jb) + 8 + len(binb))
    blob += struct.pack("<I", len(jb)) + b"JSON" + jb
    blob += struct.pack("<I", len(binb)) + b"BIN\x00" + bytes(binb)
    open(path, "wb").write(blob)

def sphere(seg=8, ring=6):
    """unit uv-sphere: (positions, normals, indices)"""
    pos, nor = [], []
    for r in range(ring + 1):
        v = r / ring
        phi = v * np.pi
        for s in range(seg + 1):
            u = s / seg
            th = u * 2 * np.pi
            x = np.sin(phi) * np.cos(th)
            y = np.cos(phi)
            z = np.sin(phi) * np.sin(th)
            pos.append((x, y, z))
            nor.append((x, y, z))
    idx = []
    for r in range(ring):
        for s in range(seg):
            a = r * (seg + 1) + s
            b = a + seg + 1
            idx += [a, b, a + 1, a + 1, b, b + 1]
    return np.array(pos, np.float32), np.array(nor, np.float32), np.array(idx, np.uint16)

def head_bounds(js, binb):
    """the Skin primitive whose verts all sit in the head y-band (the faceless ovoid)"""
    for mesh in js["meshes"]:
        for prim in mesh["primitives"]:
            mat = js["materials"][prim.get("material", 0)]["name"]
            if mat != "Skin" or "POSITION" not in prim.get("attributes", {}):
                continue
            acc = js["accessors"][prim["attributes"]["POSITION"]]
            bv = js["bufferViews"][acc["bufferView"]]
            off = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
            P = np.frombuffer(binb[off : off + acc["count"] * 12], np.float32).reshape(-1, 3)
            if P[:, 1].min() > 1.4:  # head-only mesh (body Skin starts near the feet)
                return prim, P.min(0), P.max(0)
    return None, None, None

def feature_material(name, rgba, smooth):
    return {
        "name": name,
        "pbrMetallicRoughness": {
            "baseColorFactor": list(rgba),
            "metallicFactor": 0.0,
            "roughnessFactor": 1.0 - smooth,
        },
    }

def add_sphere_prim(js, binb, mesh, joint_idx, center, scale, mat_idx, sph):
    pos, nor, idx = sph
    P = pos * np.array(scale, np.float32) + np.array(center, np.float32)
    N = nor / np.maximum(np.linalg.norm(nor, axis=1, keepdims=True), 1e-9)
    # scale distorts normals; renormalize after non-uniform scale via inverse-transpose approx
    N = N / np.array(scale, np.float32)
    N = N / np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
    n = len(P)
    joints = np.zeros((n, 4), np.uint16)
    joints[:, 0] = joint_idx
    weights = np.zeros((n, 4), np.float32)
    weights[:, 0] = 1.0

    def append_view(data, target):
        while len(binb) % 4:
            binb.append(0)
        off = len(binb)
        binb.extend(data.tobytes())
        js["bufferViews"].append({"buffer": 0, "byteOffset": off, "byteLength": len(data.tobytes()), "target": target})
        return len(js["bufferViews"]) - 1

    def append_acc(view, ctype, count, typ, mins=None, maxs=None):
        a = {"bufferView": view, "componentType": ctype, "count": count, "type": typ}
        if mins is not None:
            a["min"], a["max"] = mins, maxs
        js["accessors"].append(a)
        return len(js["accessors"]) - 1

    vpos = append_view(P, 34962)
    vnor = append_view(N, 34962)
    vj = append_view(joints, 34962)
    vw = append_view(weights, 34962)
    vind = append_view(idx, 34963)
    js["buffers"][0]["byteLength"] = len(binb)
    mesh["primitives"].append(
        {
            "attributes": {
                "POSITION": append_acc(vpos, 5126, n, "VEC3", P.min(0).tolist(), P.max(0).tolist()),
                "NORMAL": append_acc(vnor, 5126, n, "VEC3"),
                "JOINTS_0": append_acc(vj, 5123, n, "VEC4"),
                "WEIGHTS_0": append_acc(vw, 5126, n, "VEC4"),
            },
            "indices": append_acc(vind, 5123, len(idx), "SCALAR"),
            "material": mat_idx,
            "mode": 4,
        }
    )

def main():
    sph = sphere()
    for name, tone in SKIN_TONES.items():
        path = f"{ROOT}\\assets\\arena_commuter\\{name}.glb"
        js, binb = load_glb(path)
        for m in js.get("materials", []):
            if m.get("name") == "Skin":
                m.setdefault("pbrMetallicRoughness", {})["baseColorFactor"] = list(tone)
        prim, lo, hi = head_bounds(js, binb)
        if prim is None:
            sys.exit(f"{name}: no head mesh found")
        mesh = next(m for m in js["meshes"] if prim in m["primitives"])
        joints = [js["nodes"][i].get("name") for i in js["skins"][0]["joints"]]
        head_j = joints.index("Head")
        w = hi[0] - lo[0]
        h = hi[1] - lo[1]
        d = hi[2] - lo[2]
        eye_y = lo[1] + 0.62 * h
        eye_dx = 0.36 * w / 2
        eye_z = hi[2] - 0.018 * d
        brow_y = eye_y + 0.10 * h
        mouth_y = lo[1] + 0.40 * h  # the head mesh includes the neck: 0.22 landed on the throat
        mouth_z = hi[2] - 0.03 * d
        mats = [
            feature_material("Eye", [0.055, 0.032, 0.022, 1.0], 0.62),
            feature_material("Brow", [0.045, 0.028, 0.02, 1.0], 0.35),
            feature_material("Mouth", [0.10, 0.035, 0.03, 1.0], 0.35),
        ]
        base = len(js["materials"])
        js["materials"].extend(mats)
        r = 0.055 * w  # eyeball radius
        add_sphere_prim(js, binb, mesh, head_j, (-eye_dx, eye_y, eye_z), (r, r * 0.72, r * 0.55), base + 0, sph)
        add_sphere_prim(js, binb, mesh, head_j, (eye_dx, eye_y, eye_z), (r, r * 0.72, r * 0.55), base + 0, sph)
        br = 0.075 * w
        add_sphere_prim(js, binb, mesh, head_j, (-eye_dx, brow_y, eye_z - 0.004), (br, 0.012 * h / 0.25, br * 0.35), base + 1, sph)
        add_sphere_prim(js, binb, mesh, head_j, (eye_dx, brow_y, eye_z - 0.004), (br, 0.012 * h / 0.25, br * 0.35), base + 1, sph)
        add_sphere_prim(js, binb, mesh, head_j, (0.0, mouth_y, mouth_z), (0.10 * w, 0.014, 0.03 * d), base + 2, sph)
        save_glb(path, js, binb)
        print(f"{name}: face parts added (head {w:.3f}x{h:.3f}x{d:.3f}, eye y={eye_y:.3f}), skin tone set")

if __name__ == "__main__":
    main()
