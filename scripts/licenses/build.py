"""Issue a customer ZIP using the immutable 0.2.0 release. No owner code is executed."""
import base64
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import zipfile

ROOT = "doctor-site-smart-commerce/"
VERSION = "0.2.0"
DIGEST = "0b4daad01741f4fce55670c919cf7bfa7dea9fbbf8413cc8521321dc6e4e0188"
MAIN = "doctor-site-smart-commerce.php"
FILES = [MAIN, *("includes/" + name + ".php" for name in
         ("admin", "assistant", "automation", "class-dssc", "edition", "expenses", "network", "reports", "shop", "sms")),
         "assets/shop.js", "assets/admin.js", "assets/style.css"]


def openssl(*args, data=None):
    return subprocess.run(["openssl", *args], input=data, capture_output=True, check=True).stdout


def issue(source, key, target, tier, host, expires):
    if tier not in ("starter", "pro", "business") or not re.fullmatch(r"[a-z0-9.-]+", host):
        raise ValueError("invalid entitlement")
    if hashlib.sha256(source.read_bytes()).hexdigest() != DIGEST:
        raise ValueError("release checksum mismatch")
    openssl("rsa", "-in", key, "-check", "-noout")
    pem = openssl("pkey", "-in", key, "-pubout")
    payload = json.dumps(dict(tier=tier, host=host, expires=expires)).encode()
    sig = openssl("dgst", "-sha256", "-sign", key, data=payload)
    with tempfile.TemporaryDirectory() as temporary:
        pub = pathlib.Path(temporary, "public.pem")
        signature = pathlib.Path(temporary, "signature")
        pub.write_bytes(pem)
        signature.write_bytes(sig)
        openssl("dgst", "-sha256", "-verify", pub, "-signature", signature, data=payload)
    b64 = lambda data: base64.b64encode(data).decode()
    certificate = json.dumps(dict(payload=b64(payload), signature=b64(sig)))
    marker = b"define('DSSC_VERSION',"
    with zipfile.ZipFile(source) as owner, zipfile.ZipFile(target, "x", zipfile.ZIP_DEFLATED) as out:
        for name in FILES:
            content = owner.read(ROOT + name)
            if name == MAIN:
                if content.count(marker) != 1:
                    raise ValueError("release marker mismatch")
                content = content.replace(marker, b"define('DSSC_CUSTOMER_BUILD',base64_decode('" +
                                          base64.b64encode(pem) + b"'));\n" + marker)
            out.writestr(ROOT + name, content)
        out.writestr(ROOT + "license.json", certificate)
    with zipfile.ZipFile(target) as output:
        if output.testzip() or set(output.namelist()) != {ROOT + n for n in [*FILES, "license.json"]}:
            raise ValueError("package integrity check failed")


if __name__ == "__main__":
    root, version, target, tier, host, expires = sys.argv[1:]
    if version != VERSION:
        raise ValueError("unsupported release")
    issue(pathlib.Path(root, "releases", version, "owner.zip"),
          os.environ["PLUGIN_SIGNING_KEY_FILE"], target, tier, host, int(expires))
