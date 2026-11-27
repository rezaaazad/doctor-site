"""Run with PLUGIN_OWNER_ZIP and optionally PHP_BIN, on synthetic entitlements only."""
import os
import json
import pathlib
import subprocess
import tempfile
import time
import zipfile
import shutil

owner = pathlib.Path(os.environ["PLUGIN_OWNER_ZIP"]).resolve()
php = os.environ.get("PHP_BIN", "php")
stub = """define('ABSPATH', __DIR__); function plugin_dir_url($p){return '';}
function plugin_dir_path($p){return dirname($p).'/';} function add_action(...$args){}
function register_activation_hook(...$args){} function register_deactivation_hook(...$args){}
function home_url(){global $argv;return 'https://'.$argv[2];}
function wp_parse_url($s,$part){return parse_url($s,$part);}
require $argv[1].'/doctor-site-smart-commerce.php';
require DSSC_PATH.'includes/edition.php';echo dssc_entitlement();"""
with tempfile.TemporaryDirectory() as temporary:
    root = pathlib.Path(temporary)
    release = root / "releases/0.2.0"
    release.mkdir(parents=True)
    shutil.copy(owner, release / "owner.zip")
    key = root / "temporary.pem"
    subprocess.run(["openssl","genpkey","-algorithm","RSA","-out",key,"-pkeyopt","rsa_keygen_bits:2048"],check=True,capture_output=True)
    for tier,expired in [("starter",False),("pro",False),("business",False),("pro",True)]:
        package = root / (tier+str(expired)+".zip")
        subprocess.run(["python3","scripts/licenses/build.py",root,"0.2.0",package,tier,"shop.example.com",str(int(time.time())+(-3600 if expired else 3600))],env={**os.environ,"PLUGIN_SIGNING_KEY_FILE":str(key)},check=True)
        with zipfile.ZipFile(package) as archive:
            assert all("vendor-tools" not in n and b"PRIVATE KEY" not in archive.read(n) for n in archive.namelist())
            archive.extractall(root/"customer")
        folder = root/"customer/doctor-site-smart-commerce"
        def check(host):
            return subprocess.check_output([php,"-r",stub,str(folder),host],text=True)
        assert check("shop.example.com")==("expired" if expired else tier)
        assert check("other.example.com")=="expired"
        cert = folder/"license.json"
        data = json.loads(cert.read_text())
        data["signature"] = "AAAA"
        cert.write_text(json.dumps(data))
        assert check("shop.example.com")=="expired"
print("PHP validator passed all customer package cases")
