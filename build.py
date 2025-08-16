#!/usr/bin/env python3
import pathlib
import subprocess

root_dir = pathlib.Path(__file__).parent.resolve()

def build()->None:
    subprocess.run(["npm", "run", "build"],cwd=root_dir / "html", check=True, text=True)

    embedded_file_list = ["index.html", "assets/index.js", "assets/style.css"]
    for name in embedded_file_list:
        subprocess.run(["gzip", "-k", "-9", f"html/dist/{name}", "-c"], check=True, text=True, stdout=open(root_dir / f"data/{name}.gz", "wb"))

if __name__ == "__main__":
    build()
