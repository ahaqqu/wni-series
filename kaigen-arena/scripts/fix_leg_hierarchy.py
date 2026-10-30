# Quaternius Ultimate Modular exports hang Foot.L/PT.L (and .R) off Root instead of the
# lower leg, so ik_chain_build cannot close hip->knee->ankle ("joint N is not below joint M").
# This reparents Foot.L/R under LowerLeg.L/R preserving world transforms (PT.* have zero skin
# weights and are left alone). Run after import_quaternius_pack.py and BEFORE retarget_clips.py
# (the retarget bakes locals over the target hierarchy, so it must see the fixed tree).
import json, struct, sys
import numpy as np

ROOT = r"C:\Users\angga\XiaomiMiMoProjects\WNI Pejuang Nafkah\kaigen-arena"
TARGETS = ["female_commuter", "male_casual", "male_hoodie", "female_hijab"]
REPAIR = [("Foot.L", "LowerLeg.L"), ("Foot.R", "LowerLeg.R")]

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

def node_local(n):
    T = np.eye(4)
    if "translation" in n:
        T[:3, 3] = n["translation"]
    if "rotation" in n:
        x, y, z, w = n["rotation"]
        xx, yy, zz = x * x, y * y, z * z
        xy, xz, yz = x * y, x * z, y * z
        wx, wy, wz = w * x, w * y, w * z
        T = T @ np.array([
            [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0],
            [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0],
            [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0],
            [0, 0, 0, 1]])
    if "scale" in n:
        S = np.eye(4)
        S[0, 0], S[1, 1], S[2, 2] = n["scale"]
        T = T @ S
    return T

def world_matrix(nodes, parent, i):
    chain = []
    cur = i
    while cur is not None:
        chain.append(cur)
        cur = parent.get(cur)
    M = np.eye(4)
    for idx in reversed(chain):
        M = M @ node_local(nodes[idx])
    return M

def decompose(M):
    t = M[:3, 3].copy()
    R = M[:3, :3]
    # uniform scale assumed (rig joints carry none)
    s = np.linalg.norm(R[:, 0])
    R = R / max(s, 1e-9)
    q = np.empty(4)
    tr = R[0, 0] + R[1, 1] + R[2, 2]
    if tr > 0:
        w = np.sqrt(1.0 + tr) / 2
        x = (R[2, 1] - R[1, 2]) / (4 * w)
        y = (R[0, 2] - R[2, 0]) / (4 * w)
        z = (R[1, 0] - R[0, 1]) / (4 * w)
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
        x = np.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) / 2
        w = (R[2, 1] - R[1, 2]) / (4 * x)
        y = (R[0, 1] + R[1, 0]) / (4 * x)
        z = (R[0, 2] + R[2, 0]) / (4 * x)
    elif R[1, 1] > R[2, 2]:
        y = np.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) / 2
        w = (R[0, 2] - R[2, 0]) / (4 * y)
        x = (R[0, 1] + R[1, 0]) / (4 * y)
        z = (R[1, 2] + R[2, 1]) / (4 * y)
    else:
        z = np.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) / 2
        w = (R[1, 0] - R[0, 1]) / (4 * z)
        x = (R[0, 2] + R[2, 0]) / (4 * z)
        y = (R[1, 2] + R[2, 1]) / (4 * z)
    return t, np.array([x, y, z, w]), s

def reparent(js, child_name, new_parent_name):
    nodes = js["nodes"]
    by_name = {n.get("name"): i for i, n in enumerate(nodes)}
    parent = {}
    for i, n in enumerate(nodes):
        for ch in n.get("children", []):
            parent[ch] = i
    ci, pi = by_name[child_name], by_name[new_parent_name]
    if parent.get(ci) == pi:
        return False
    old_world = world_matrix(nodes, parent, ci)
    old_parent = parent.get(ci)
    if old_parent is not None:
        nodes[old_parent]["children"].remove(ci)
        if not nodes[old_parent]["children"]:
            del nodes[old_parent]["children"]
    nodes[pi].setdefault("children", []).append(ci)
    parent[ci] = pi
    new_local = np.linalg.inv(world_matrix(nodes, parent, pi)) @ old_world
    t, q, s = decompose(new_local)
    n = nodes[ci]
    n["translation"] = [float(v) for v in t]
    n["rotation"] = [float(v) for v in q]
    n.pop("scale", None)
    return True

def main():
    for name in TARGETS:
        path = f"{ROOT}\\assets\\arena_commuter\\{name}.glb"
        js, binb = load_glb(path)
        changed = [f"{c}->{p}" for c, p in REPAIR if reparent(js, c, p)]
        if not changed:
            print(name, "already repaired")
            continue
        save_glb(path, js, binb)
        print(name, "repaired:", ", ".join(changed))

if __name__ == "__main__":
    main()
