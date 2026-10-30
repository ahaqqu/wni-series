# Quaternius pack (.gltf, embedded buffers) -> glb in assets/arena_commuter, recolored
# to Indonesian commuter skins. Source: quaternius.com Ultimate Modular Men/Women (CC0).
import base64, json, os, struct, sys

ROOT = r"C:\Users\angga\XiaomiMiMoProjects\WNI Pejuang Nafkah\kaigen-arena"
SRC = ROOT + r"\out\qpack"
DST = ROOT + r"\assets\arena_commuter"

# linear baseColorFactor values (glTF factors are LINEAR)
SKIN = [0.36, 0.215, 0.115, 1.0]
SKIN_D = [0.265, 0.15, 0.08, 1.0]
HAIR_BLACK = [0.03, 0.018, 0.012, 1.0]
HIJAB = [0.115, 0.28, 0.235, 1.0]     # dusty teal jilbab
DENIM = [0.028, 0.045, 0.10, 1.0]

# per file: material name -> factor (regions verified with scripts/_probe_mats.py)
RECOLOR = {
    # LightBrown = grey tee (kept); LightBlue = dark trousers (kept as-is)
    "m_casual": {"Skin": SKIN, "Skin_Darker": SKIN_D, "Hair": HAIR_BLACK},
    "m_hoodie": {"Skin": SKIN, "Skin_Darker": SKIN_D, "Hair": HAIR_BLACK, "LightBlue": DENIM},
    # Orange = full-length pants -> denim; Brown = hair bit (not pants!)
    "w_casual": {"Skin": SKIN, "Hair_Brown": HAIR_BLACK, "Hair_Blond": HAIR_BLACK,
                 "Brown": HAIR_BLACK, "Orange": DENIM},
    # Red = hair + shoes, Brown = hair bun -> both become the jilbab; LimeGreen = blouse+skirt
    "w_formal": {"Skin": SKIN, "Red": HIJAB, "Brown": HIJAB,
                 "LimeGreen": [0.16, 0.22, 0.32, 1.0]},
}
OUT = {"m_casual": "male_casual", "m_hoodie": "male_hoodie",
       "w_casual": "female_commuter", "w_formal": "female_hijab"}

def load_embedded(path):
    j = json.load(open(path, encoding="utf-8"))
    bins = []
    for b in j["buffers"]:
        uri = b.get("uri", "")
        if not uri.startswith("data:"):
            sys.exit(f"{path}: external buffer not supported: {uri[:60]}")
        bins.append(base64.b64decode(uri.split(",", 1)[1]))
    if len(bins) > 1:
        joined, offs = bytearray(), []
        for b in bins:
            while len(joined) % 4:
                joined.append(0)
            offs.append(len(joined))
            joined += b
        for bv in j["bufferViews"]:
            bv["byteOffset"] = bv.get("byteOffset", 0) + offs[bv.get("buffer", 0)]
            bv["buffer"] = 0
        bins = [bytes(joined)]
    j["buffers"] = [{"byteLength": len(bins[0])}]
    return j, bytearray(bins[0])

def save_glb(path, js, binb):
    while len(binb) % 4:
        binb.append(0)
    jb = json.dumps(js, separators=(",", ":")).encode("utf-8")
    jb += b" " * ((4 - len(jb) % 4) % 4)
    blob = b"glTF" + struct.pack("<II", 2, 12 + 8 + len(jb) + 8 + len(binb))
    blob += struct.pack("<I", len(jb)) + b"JSON" + jb
    blob += struct.pack("<I", len(binb)) + b"BIN\x00" + bytes(binb)
    open(path, "wb").write(blob)

def main():
    os.makedirs(DST, exist_ok=True)
    for key, out_name in OUT.items():
        js, binb = load_embedded(os.path.join(SRC, key + ".gltf"))
        for m in js.get("materials", []):
            f = RECOLOR[key].get(m.get("name", ""))
            if f:
                m.setdefault("pbrMetallicRoughness", {})["baseColorFactor"] = list(f)
        out = os.path.join(DST, out_name + ".glb")
        save_glb(out, js, binb)
        print("wrote", os.path.basename(out), f"{os.path.getsize(out)/1e6:.2f} MB",
              "| anims", len(js.get("animations", [])), "| mats recolored",
              sum(1 for m in js["materials"] if m["name"] in RECOLOR[key]))

if __name__ == "__main__":
    main()
