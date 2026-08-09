import os
import sys

def apply_patch(patch_file):
    with open(patch_file, 'r') as f:
        lines = f.readlines()

    # Simple patch parser since we know the structure
    # However, standard patching is tricky.
    # Let's just use the `patch` command, but tell it to NOT rename to .orig!
    # patch -p1 --no-backup-if-mismatch < social.patch
    pass

