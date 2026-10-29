import re, codecs, os, sys, urllib.request, json

def folder_files(folder_id):
    url = f"https://drive.google.com/drive/folders/{folder_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    raw = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    i = raw.index("_DRIVE_ivd'] = '") + len("_DRIVE_ivd'] = '")
    j = raw.index("'", i)
    dec = codecs.decode(raw[i:j], "unicode_escape")
    out = []
    # entries: [id, [parent], name, mime, ...]
    for m in re.finditer(r'\["([A-Za-z0-9_-]{25,})",\[[^]]*\],"((?:[^"\\]|\\.)*)","([^"]+)"', dec):
        pid, name, mime = m.group(1), m.group(2), m.group(3)
        out.append((pid, name, mime))
    return out

def download(file_id, dest):
    url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    return os.path.getsize(dest)

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "list":
        for fid, name, mime in folder_files(sys.argv[2]):
            print(fid, "|", name, "|", mime)
    elif cmd == "get":
        print(download(sys.argv[2], sys.argv[3]))
