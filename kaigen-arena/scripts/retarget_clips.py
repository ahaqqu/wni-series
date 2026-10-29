# Retarget default_character.glb clips (UE-style rig) onto the Mixamo-rigged kaigen_bot.glb.
# Method: pure world-frame copy — Wd_j(t) = Ws_j(t) (both rigs are upright humans facing +Z;
# skinning re-frames each mesh's own bind geometry onto the copied frames). Hips translation
# = bot hips rest + scaled source pelvis delta. Output: assets/arena_retarget/actions.glb
# -> cooked arena_retarget/actions/<Clip>.hza with joint names matching the bot 1:1.
import json, struct, sys, math, os
import numpy as np

ROOT = r"C:\Users\angga\XiaomiMiMoProjects\WNI Pejuang Nafkah\kaigen-arena"
SRC = ROOT + r"\gameplay_blocks\assets\gameplay_blocks\character\default_character.glb"
DST = ROOT + r"\assets\starting_template\characters\kaigen_bot.glb"
OUT = ROOT + r"\assets\arena_retarget\actions.glb"

MAP = {
    "pelvis": "Hips",
    "spine_01": "Spine", "spine_02": "Spine1", "spine_03": "Spine2",
    "neck_01": "Neck", "Head": "Head",
    "clavicle_l": "LeftShoulder", "upperarm_l": "LeftArm", "lowerarm_l": "LeftForeArm", "hand_l": "LeftHand",
    "clavicle_r": "RightShoulder", "upperarm_r": "RightArm", "lowerarm_r": "RightForeArm", "hand_r": "RightHand",
    "thigh_l": "LeftUpLeg", "calf_l": "LeftLeg", "foot_l": "LeftFoot", "ball_l": "LeftToeBase", "ball_leaf_l": "LeftToe_End",
    "thigh_r": "RightUpLeg", "calf_r": "RightLeg", "foot_r": "RightFoot", "ball_r": "RightToeBase", "ball_leaf_r": "RightToe_End",
}
for f in ["index", "middle", "ring", "pinky", "thumb"]:
    for side, m in [("l", "Left"), ("r", "Right")]:
        for n in range(1, 4):
            MAP[f"{f}_{n:02d}_{side}"] = f"{m}Hand{f.capitalize()}{n}"
        MAP[f"{f}_04_leaf_{side}"] = f"{m}Hand{f.capitalize()}4"

def load_glb(path):
    d = open(path, "rb").read()
    off, js, binb = 12, None, None
    while off < len(d):
        ln, ty = struct.unpack_from("<I4s", d, off); off += 8
        if ty == b"JSON": js = json.loads(d[off:off + ln].decode("utf-8"))
        elif ty == b"BIN\x00": binb = d[off:off + ln]
        off += ln + (ln % 4 and 4 - ln % 4 or 0)
    return js, binb

def q_to_m(q):
    x, y, z, w = q
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])

def m_to_q(R):
    tr = np.trace(R)
    if tr > 0:
        s = math.sqrt(tr + 1.0) * 2
        w, x, y, z = 0.25 * s, (R[2, 1] - R[1, 2]) / s, (R[0, 2] - R[2, 0]) / s, (R[1, 0] - R[0, 1]) / s
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
        s = math.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) * 2
        w, x, y, z = (R[2, 1] - R[1, 2]) / s, 0.25 * s, (R[0, 1] + R[1, 0]) / s, (R[0, 2] + R[2, 0]) / s
    elif R[1, 1] > R[2, 2]:
        s = math.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) * 2
        w, x, y, z = (R[0, 2] - R[2, 0]) / s, (R[0, 1] + R[1, 0]) / s, 0.25 * s, (R[1, 2] + R[2, 1]) / s
    else:
        s = math.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) * 2
        w, x, y, z = (R[1, 0] - R[0, 1]) / s, (R[0, 2] + R[2, 0]) / s, (R[1, 2] + R[2, 1]) / s, 0.25 * s
    q = np.array([x, y, z, w]); return q / np.linalg.norm(q)

def parents_of(js):
    p = {}
    for i, n in enumerate(js["nodes"]):
        for c in n.get("children", []): p[c] = i
    return p

def rest_locals(js):
    return [(np.array(n.get("translation", [0., 0., 0.])),
             q_to_m(n.get("rotation", [0, 0, 0, 1])),
             np.array(n.get("scale", [1., 1., 1.]))) for n in js["nodes"]]

def compose_world(locals_, parent):
    W = [None] * len(locals_)
    def rec(i):
        if W[i] is not None: return W[i]
        T, R, S = locals_[i]
        M = np.eye(4); M[:3, :3] = R @ np.diag(S); M[:3, 3] = T
        if parent.get(i) is not None: M = rec(parent[i]) @ M
        W[i] = M; return M
    for i in range(len(locals_)): rec(i)
    return W

def read_acc(js, binb, i):
    a = js["accessors"][i]; v = js["bufferViews"][a["bufferView"]]
    nc = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[a["type"]]
    off = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    arr = np.frombuffer(binb, dtype="<f4", count=a["count"] * nc, offset=off)
    return arr.reshape(a["count"], nc) if nc > 1 else arr

def slerp_batch(q0, q1, t):
    q0 = q0 / np.linalg.norm(q0, axis=-1, keepdims=True)
    q1 = q1 / np.linalg.norm(q1, axis=-1, keepdims=True)
    d = np.sum(q0 * q1, axis=-1, keepdims=True)
    q1 = np.where(d < 0, -q1, q1); d = np.clip(np.abs(d), -1, 1)
    th = np.arccos(d); s = np.sin(th)
    safe = np.where(s < 1e-6, 1.0, s)
    w0 = np.where(s < 1e-6, 1 - t, np.sin((1 - t) * th) / safe)
    w1 = np.where(s < 1e-6, t, np.sin(t * th) / safe)
    q = q0 * w0 + q1 * w1
    return q / np.linalg.norm(q, axis=-1, keepdims=True)

def main():
    sjs, sbin = load_glb(SRC)
    djs, dbin = load_glb(DST)
    sname2i = {n.get("name", ""): i for i, n in enumerate(sjs["nodes"])}
    # bot joints are namespaced (mixamorig:Hips); the engine strips namespaces when matching, so we do too
    dname2i = {}
    for i, n in enumerate(djs["nodes"]):
        raw = n.get("name", "")
        stripped = raw.split(":")[-1]
        dname2i[raw] = i
        dname2i.setdefault(stripped, i)
    dparent = parents_of(djs)
    dlocals = rest_locals(djs)
    dworld = compose_world(dlocals, dparent)
    slocals = rest_locals(sjs)
    sworld = compose_world(slocals, parents_of(sjs))

    missing = [v for v in MAP.values() if v not in dname2i]
    if missing: sys.exit("map targets missing in bot: " + str(missing))
    skin_joints = set(djs["skins"][0]["joints"])
    print(f"mapped {len(MAP)} joints; skin joints {len(skin_joints)}")

    hips_s = sworld[sname2i["pelvis"]][:3, 3]
    hips_d = dworld[dname2i["Hips"]][:3, 3]
    scale = hips_d[1] / hips_s[1]
    print(f"hips src {np.round(hips_s,3)} dst {np.round(hips_d,3)} scale {scale:.4f}")

    def sample_rot(binbuf, sm, times):
        t_in = read_acc(sjs, binbuf, sm["input"]).reshape(-1)
        qf = read_acc(sjs, binbuf, sm["output"])
        idx = np.clip(np.searchsorted(t_in, times, side="right") - 1, 0, len(t_in) - 2)
        t0, t1 = t_in[idx], t_in[idx + 1]
        f = np.where(t1 > t0, (times - t0) / np.where(t1 > t0, t1 - t0, 1), 0)[..., None]
        return slerp_batch(qf[idx], qf[idx + 1], f)

    def sample_lin(binbuf, sm, times):
        t_in = read_acc(sjs, binbuf, sm["input"]).reshape(-1)
        v = read_acc(sjs, binbuf, sm["output"])
        idx = np.clip(np.searchsorted(t_in, times, side="right") - 1, 0, len(t_in) - 2)
        t0, t1 = t_in[idx], t_in[idx + 1]
        f = np.where(t1 > t0, (times - t0) / np.where(t1 > t0, t1 - t0, 1), 0)[..., None]
        return v[idx] * (1 - f) + v[idx + 1] * f

    sparent = parents_of(sjs)
    src_order = []
    def rec(i):
        for c in sjs["nodes"][i].get("children", []): rec(c)
        src_order.append(i)
    for r in [i for i in range(len(sjs["nodes"])) if i not in sparent]: rec(r)
    src_order = src_order[::-1]  # parents first

    baked = []
    for anim in sjs["animations"]:
        times = read_acc(sjs, sbin, anim["samplers"][anim["channels"][0]["sampler"]]["input"]).reshape(-1)
        nf = len(times)
        rot = {}
        trans = {}
        for ch in anim["channels"]:
            tgt = ch["target"]; ni, path = tgt["node"], tgt["path"]
            sm = anim["samplers"][ch["sampler"]]
            if path == "rotation":
                q = sample_rot(sbin, sm, times)
                rot[ni] = np.array([q_to_m(q[k]) for k in range(nf)])
            elif path == "translation":
                trans[ni] = sample_lin(sbin, sm, times)
        # compose source WORLD per frame (nf x 4 x 4 per joint)
        Wsf = [None] * len(sjs["nodes"])
        for i in src_order:
            R_i = rot[i] if i in rot else np.tile(slocals[i][1], (nf, 1, 1))
            T_i = trans[i] if i in trans else np.tile(slocals[i][0], (nf, 1))
            L = np.tile(np.eye(4), (nf, 1, 1))
            L[:, :3, :3] = R_i * slocals[i][2]
            L[:, :3, 3] = T_i
            p = sparent.get(i)
            Wsf[i] = L if p is None else Wsf[p] @ L
        # bot WORLD = source WORLD for mapped joints; hips T scaled
        botW = {}
        for sname, dname in MAP.items():
            botW[dname2i[dname]] = Wsf[sname2i[sname]]
        pel_w = Wsf[sname2i["pelvis"]][:, :3, 3]
        hips_world_T = hips_d + (pel_w - hips_s) * scale
        hips_i = dname2i["Hips"]
        botW[hips_i] = botW[hips_i].copy()
        botW[hips_i][:, :3, 3] = hips_world_T

        # bot LOCAL, top-down over the bot hierarchy
        out_R = {}
        out_T = {}
        def visit(di):
            p = dparent.get(di)
            if p is not None: visit(p)
            if di in botW:
                Wp = out_W[p] if p is not None else np.tile(np.eye(4), (nf, 1, 1))
                # local = inv(parent_world) @ world
                Rp = Wp[:, :3, :3]
                Rt = np.swapaxes(Rp, -1, -2)
                local_R = Rt @ botW[di][:, :3, 3 - 3:3, :3] if False else Rt @ botW[di][:, :3, :3]
                local_T = np.einsum("nij,nj->ni", Rt, botW[di][:, :3, 3] - Wp[:, :3, 3])
                out_R[di] = local_R
                out_T[di] = local_T
                out_W[di] = botW[di]
            elif di not in out_W:
                out_R[di] = np.tile(dlocals[di][1], (nf, 1, 1))
                out_W[di] = None  # filled below via composition if needed
        # visit only needs correct parents for mapped nodes; all mapped parents are mapped
        # except KaigenBot_Rig (rest, identity) — handle by composing rest for unmapped ancestors
        out_W = [None] * len(djs["nodes"])
        def visit2(di):
            p = dparent.get(di)
            if p is not None and out_W[p] is None: visit2(p)
            if di in botW:
                if p is None:
                    Wp_R = np.tile(np.eye(3), (nf, 1, 1)); Wp_T = np.zeros((nf, 3))
                else:
                    Wp_R = out_W[p][:, :3, :3]; Wp_T = out_W[p][:, :3, 3]
                Rt = np.swapaxes(Wp_R, -1, -2)
                out_R[di] = Rt @ botW[di][:, :3, :3]
                out_T[di] = np.einsum("nij,nj->ni", Rt, botW[di][:, :3, 3] - Wp_T)
                out_W[di] = botW[di]
            else:
                # unmapped: rest local composed with parent world (parent must already be in out_W)
                local_R = dlocals[di][1]; local_T = dlocals[di][0]
                if p is None:
                    W = np.tile(np.eye(4), (nf, 1, 1))
                else:
                    Wp = out_W[p]
                    if Wp is None:
                        # compose rest world for this ancestor chain (static)
                        rest_W = np.eye(4); q = di
                        # fallback: static rest world of parent
                        Wp_static = dworld[p][:3, :3]; Wp_static_T = dworld[p][:3, 3]
                        Wp = np.tile(np.eye(4), (nf, 1, 1))
                        Wp[:, :3, :3] = Wp_static; Wp[:, :3, 3] = Wp_static_T
                out_R[di] = np.tile(local_R, (nf, 1, 1))
                out_T[di] = np.tile(local_T, (nf, 1))
                if p is None:
                    W = np.tile(np.eye(4), (nf, 1, 1)); W[:, :3, :3] = local_R; W[:, :3, 3] = local_T
                else:
                    Wp = out_W[p]
                    if Wp is None:
                        Wp = np.tile(np.eye(4), (nf, 1, 1))
                        Wp[:, :3, :3] = dworld[p][:3, :3]; Wp[:, :3, 3] = dworld[p][:3, 3]
                        out_W[p] = Wp
                    W = Wp @ (lambda M: M)(np.tile(np.eye(4), (nf, 1, 1)) @ 1)  # placeholder
                    loc = np.tile(np.eye(4), (nf, 1, 1)); loc[:, :3, :3] = local_R; loc[:, :3, 3] = local_T
                    W = Wp @ loc
                out_W[di] = W
        # reset and do it properly in hierarchy order (single pass, parents first)
        out_R.clear(); out_T.clear()
        for di in range(len(djs["nodes"])): out_W[di] = None
        def world_of_rest(di):
            # static rest world already computed in dworld
            W = np.tile(np.eye(4), (nf, 1, 1))
            W[:, :3, :3] = dworld[di][:3, :3]; W[:, :3, 3] = dworld[di][:3, 3]
            return W
        bot_indices = sorted(djs["nodes"][k].get("name") for k in skin_joints)  # noqa (just ensuring sorted works)
        # hierarchy pass: parents before children over ALL nodes
        dorder = []
        def drec(i):
            for c in djs["nodes"][i].get("children", []): drec(c)
            dorder.append(i)
        for r in [i for i in range(len(djs["nodes"])) if i not in dparent]: drec(r)
        dorder = dorder[::-1]
        for di in dorder:
            p = dparent.get(di)
            if di in botW:
                if p is None:
                    Wp_R = np.tile(np.eye(3), (nf, 1, 1)); Wp_T = np.zeros((nf, 3))
                elif out_W[p] is not None and out_R.get(p) is not None and p in botW:
                    Wp_R = out_W[p][:, :3, :3]; Wp_T = out_W[p][:, :3, 3]
                else:
                    # parent unmapped: use its (possibly static) world
                    Wp_R = np.tile(dworld[p][:3, :3], (nf, 1, 1)); Wp_T = np.tile(dworld[p][:3, 3], (nf, 1))
                Rt = np.swapaxes(Wp_R, -1, -2)
                out_R[di] = Rt @ botW[di][:, :3, :3]
                out_T[di] = np.einsum("nij,nj->ni", Rt, botW[di][:, :3, 3] - Wp_T)
                Wp = np.tile(np.eye(4), (nf, 1, 1)); Wp[:, :3, :3] = Wp_R; Wp[:, :3, 3] = Wp_T
                out_W[di] = Wp @ botW[di] if False else botW[di]  # world IS botW
                out_W[di] = botW[di]
            else:
                # unmapped node: keep rest local; world = parent_world @ rest_local
                if p is None:
                    W = np.tile(np.eye(4), (nf, 1, 1)); W[:, :3, :3] = dlocals[di][1]; W[:, :3, 3] = dlocals[di][0]
                else:
                    Pw = out_W[p] if out_W[p] is not None else world_of_rest(p)
                    if out_W[p] is None: out_W[p] = Pw
                    loc = np.tile(np.eye(4), (nf, 1, 1)); loc[:, :3, :3] = dlocals[di][1]; loc[:, :3, 3] = dlocals[di][0]
                    W = Pw @ loc
                out_R[di] = np.tile(dlocals[di][1], (nf, 1, 1))
                out_T[di] = np.tile(dlocals[di][0], (nf, 1))
                out_W[di] = W
        # rotation channels: skin joints only, excluding pure-rest ones we didn't map? include all
        # skin joints: mapped (animated) + unmapped (static rest -> constant, skip to save space)
        animated = {di: (out_R[di], out_T[di]) for di in botW}
        baked.append((anim["name"], times, animated))
        print(f"  {anim['name']}: {nf} frames, {len(animated)} animated joints")

    # --- write glb: bot JSON + new animations ---
    out = {k: v for k, v in djs.items() if k not in ("animations", "samplers", "accessors", "bufferViews", "buffers")}
    buf = bytearray(dbin or b"")
    def pad4():
        while len(buf) % 4: buf.append(0)
    views = list(djs.get("bufferViews", []))
    accs = list(djs["accessors"])
    sams, chans, anims_out = [], [], []
    for name, times, animated in baked:
        nf = len(times)
        pad4(); t_off = len(buf); buf += times.astype("<f4").tobytes()
        views.append({"buffer": 0, "byteOffset": t_off, "byteLength": nf * 4})
        accs.append({"bufferView": len(views) - 1, "componentType": 5126, "count": nf, "type": "SCALAR",
                     "min": [float(times[0])], "max": [float(times[-1])]})
        t_acc = len(accs) - 1
        c0, s0 = len(chans), len(sams)
        for di in sorted(animated):
            Rf, Tf = animated[di]
            qs = np.array([m_to_q(Rf[k]) for k in range(nf)])
            for k in range(1, nf):
                if np.dot(qs[k], qs[k - 1]) < 0: qs[k] = -qs[k]
            pad4(); off = len(buf); buf += qs.astype("<f4").tobytes()
            views.append({"buffer": 0, "byteOffset": off, "byteLength": nf * 16})
            accs.append({"bufferView": len(views) - 1, "componentType": 5126, "count": nf, "type": "VEC4"})
            sams.append({"input": t_acc, "output": len(accs) - 1, "interpolation": "LINEAR"})
            chans.append({"sampler": len(sams) - 1 - s0, "target": {"node": di, "path": "rotation"}})
            pad4(); off = len(buf); buf += Tf.astype("<f4").tobytes()
            views.append({"buffer": 0, "byteOffset": off, "byteLength": nf * 12})
            accs.append({"bufferView": len(views) - 1, "componentType": 5126, "count": nf, "type": "VEC3"})
            sams.append({"input": t_acc, "output": len(accs) - 1, "interpolation": "LINEAR"})
            chans.append({"sampler": len(sams) - 1 - s0, "target": {"node": di, "path": "translation"}})
        anims_out.append({"name": name, "channels": chans[c0:], "samplers": sams[s0:]})
    pad4()
    out["bufferViews"] = views
    out["accessors"] = accs
    out["animations"] = anims_out
    out["buffers"] = [{"byteLength": len(buf)}]
    js_bytes = json.dumps(out, separators=(",", ":")).encode("utf-8")
    js_bytes += b" " * ((4 - len(js_bytes) % 4) % 4)
    blob = b"glTF" + struct.pack("<II", 2, 12 + 8 + len(js_bytes) + 8 + len(buf))
    blob += struct.pack("<I", len(js_bytes)) + b"JSON" + js_bytes
    blob += struct.pack("<I", len(buf)) + b"BIN\x00" + bytes(buf)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "wb").write(blob)
    print(f"wrote {OUT} ({len(blob)/1e6:.2f} MB, {len(anims_out)} animations)")

if __name__ == "__main__":
    main()
