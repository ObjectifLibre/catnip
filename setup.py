import subprocess

import setuptools
from setuptools.extern.packaging import version


def get_version() -> str:
    try:
        ver = (
            subprocess.check_output(["git", "describe"])
            .decode()
            .strip()
            .split("-")
        )

        # Stable
        if len(ver) == 1:
            return ver[0]

        major, minor, point = ver[0].split(".")
        return f"{major}.{minor}.{int(point)+1}-dev{ver[1]}"

    except subprocess.CalledProcessError:
        try:
            commit = (
                subprocess.check_output(
                    ["git", "rev-parse", "--short", "HEAD"]
                )
                .decode()
                .strip()
            )
            return f"0.0.0.{commit}"
        except subprocess.CalledProcessError:
            # Useful with tox
            return "0.0.0.test"


setuptools.setup(version=get_version())
