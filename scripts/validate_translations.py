#!/usr/bin/env python3
"""
Validates translation parity across all target Indian languages in frontend/src/i18n/locales/
"""

import os
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LOCALES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "src", "i18n", "locales")
MASTER_LOCALE = "hi.json"

def get_nested_keys(data, prefix=""):
    keys = set()
    for k, v in data.items():
        full_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(get_nested_keys(v, full_key))
        else:
            keys.add(full_key)
    return keys

def main():
    master_path = os.path.join(LOCALES_DIR, MASTER_LOCALE)
    if not os.path.exists(master_path):
        print(f"❌ Master locale {master_path} not found.")
        sys.exit(1)

    with open(master_path, "r", encoding="utf-8") as f:
        master_data = json.load(f)

    master_keys = get_nested_keys(master_data)
    print(f"📖 Master language ({MASTER_LOCALE}) loaded with {len(master_keys)} translation keys.")

    all_passed = True
    files = [f for f in os.listdir(LOCALES_DIR) if f.endswith(".json")]

    for filename in sorted(files):
        file_path = os.path.join(LOCALES_DIR, filename)
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                lang_data = json.load(f)
            except Exception as e:
                print(f"❌ Syntax error in {filename}: {e}")
                all_passed = False
                continue

        lang_keys = get_nested_keys(lang_data)
        missing = master_keys - lang_keys
        extra = lang_keys - master_keys

        if missing:
            print(f"❌ {filename}: Missing {len(missing)} keys: {missing}")
            all_passed = False
        else:
            print(f"✅ {filename}: 100% key parity ({len(lang_keys)} keys).")

    if not all_passed:
        print("\n❌ Translation validation failed. Fix missing keys.")
        sys.exit(1)
    else:
        print("\n🎉 All 11 Indian language resources passed translation validation.")

if __name__ == "__main__":
    main()
