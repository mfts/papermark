#!/usr/bin/env python3
"""
DOCX Sanitizer — fixes common issues that cause LibreOffice conversion failures.

Supported fixes:
  - RTL compat: Downgrade compatibilityMode 15→14 for Arabic/RTL documents
    that cause LibreOffice's layout engine to hang indefinitely.
  - Glossary removal: Remove corrupt glossary parts (0-byte fontTable.xml etc.)
  - SDT unwrap: Unwrap <w:sdt> blocks from Google Docs exports that crash
    LibreOffice.

Usage:
    python docx-sanitizer.py input.docx [output.docx]
    python docx-sanitizer.py --mode rtl -v input.docx output.docx
    python docx-sanitizer.py --mode all -v input.docx output.docx

Modes:
    rtl  — RTL compat fix + glossary removal only
    sdt  — SDT unwrap only (original behavior)
    all  — All fixes (default)

If output is omitted, the input file is overwritten in place.
"""

import sys
import os
import re
import logging
import zipfile
import tempfile
import argparse
import shutil

log = logging.getLogger("docx-sanitizer")


def has_rtl_content(doc_content: str) -> bool:
    """Check whether document.xml contains RTL / complex-script markers."""
    return '<w:rtl/>' in doc_content or '<w:bidi/>' in doc_content


def downgrade_compat_mode(content: str) -> tuple:
    """Downgrade compatibilityMode from 15 to 14 in settings.xml content."""
    new_content = re.sub(
        r'(<w:compatSetting\b'
        r'(?=[^>]*\bw:name="compatibilityMode")'
        r'(?=[^>]*\bw:uri="http://schemas\.microsoft\.com/office/word")'
        r'[^>]*\bw:val=")15(")',
        r'\g<1>14\2',
        content,
    )
    changed = new_content != content
    return new_content, changed


def remove_glossary(tmp_dir: str) -> bool:
    """Remove word/glossary/ directory and clean up its references."""
    glossary_dir = os.path.join(tmp_dir, 'word', 'glossary')
    if not os.path.isdir(glossary_dir):
        return False

    shutil.rmtree(glossary_dir)
    log.info("Removed word/glossary/ directory")

    rels_path = os.path.join(tmp_dir, 'word', '_rels', 'document.xml.rels')
    if os.path.exists(rels_path):
        with open(rels_path, 'r', encoding='utf-8') as f:
            rels_content = f.read()
        new_rels = re.sub(
            r'<Relationship[^>]*Target="glossary/[^"]*"[^>]*/>\s*',
            '',
            rels_content,
        )
        if new_rels != rels_content:
            with open(rels_path, 'w', encoding='utf-8') as f:
                f.write(new_rels)
            log.info("Removed glossary relationship from document.xml.rels")

    ct_path = os.path.join(tmp_dir, '[Content_Types].xml')
    if os.path.exists(ct_path):
        with open(ct_path, 'r', encoding='utf-8') as f:
            ct_content = f.read()
        new_ct = re.sub(
            r'<Override[^>]*PartName="/word/glossary/[^"]*"[^>]*/>\s*',
            '',
            ct_content,
        )
        if new_ct != ct_content:
            with open(ct_path, 'w', encoding='utf-8') as f:
                f.write(new_ct)
            log.info("Removed glossary overrides from [Content_Types].xml")

    return True


def unwrap_sdt(content: str) -> tuple:
    """Replace <w:sdt>...<w:sdtContent>X</w:sdtContent></w:sdt> with X."""
    count = 0
    while '<w:sdt>' in content:
        old = content
        content = re.sub(
            r'<w:sdt><w:sdtPr>.*?</w:sdtPr><w:sdtContent>(.*?)</w:sdtContent></w:sdt>',
            r'\1',
            content,
            count=1,
            flags=re.DOTALL,
        )
        if content == old:
            break
        count += 1
    return content, count


def repackage_docx(tmp_dir: str, output_path: str):
    """Repackage extracted DOCX with [Content_Types].xml first."""
    entries = []
    ct_entry = None
    for root, _dirs, files in os.walk(tmp_dir):
        for file in files:
            fp = os.path.join(root, file)
            arc = os.path.relpath(fp, tmp_dir)
            if arc == '[Content_Types].xml':
                ct_entry = (fp, arc)
            else:
                entries.append((fp, arc))
    if ct_entry:
        entries.insert(0, ct_entry)

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for fp, arc in entries:
            z.write(fp, arc)


def sanitize_docx(input_path: str, output_path: str, mode: str = 'all') -> bool:
    try:
        input_size = os.path.getsize(input_path)
        log.info("Input: %s (%d bytes), mode: %s", input_path, input_size, mode)

        with tempfile.TemporaryDirectory() as tmp:
            with zipfile.ZipFile(input_path, 'r') as z:
                tmp_abs = os.path.abspath(tmp)
                for info in z.infolist():
                    member_name = info.filename
                    target_path = os.path.abspath(os.path.join(tmp, member_name))
                    if not target_path.startswith(tmp_abs + os.sep):
                        raise ValueError(f"Unsafe ZIP entry path: {member_name}")
                    if info.is_dir():
                        continue

                    parent_dir = os.path.dirname(target_path)
                    if parent_dir:
                        os.makedirs(parent_dir, exist_ok=True)

                    with z.open(info) as src, open(target_path, 'wb') as dst:
                        shutil.copyfileobj(src, dst)

            doc_path = os.path.join(tmp, 'word', 'document.xml')
            if not os.path.exists(doc_path):
                log.error("No word/document.xml found")
                return False

            with open(doc_path, 'r', encoding='utf-8') as f:
                doc_content = f.read()

            doc_modified = False

            # --- RTL compat fixes (glossary removal + compat mode downgrade) ---
            if mode in ('rtl', 'all'):
                remove_glossary(tmp)

                if has_rtl_content(doc_content):
                    log.info("RTL content detected — checking compatibilityMode")
                    settings_path = os.path.join(tmp, 'word', 'settings.xml')
                    if os.path.exists(settings_path):
                        with open(settings_path, 'r', encoding='utf-8') as f:
                            settings_content = f.read()
                        new_settings, changed = downgrade_compat_mode(settings_content)
                        if changed:
                            with open(settings_path, 'w', encoding='utf-8') as f:
                                f.write(new_settings)
                            log.info("Downgraded compatibilityMode 15 → 14")
                        else:
                            log.info("compatibilityMode is not 15 — no change needed")
                    else:
                        log.info("No word/settings.xml found — skipping compat fix")
                else:
                    log.info("No RTL content detected — skipping compat downgrade")

            # --- SDT unwrap ---
            if mode in ('sdt', 'all'):
                new_content, sdt_count = unwrap_sdt(doc_content)
                if sdt_count:
                    log.info("Unwrapped %d <w:sdt> block(s) (removed %d bytes)",
                             sdt_count, len(doc_content) - len(new_content))
                    doc_content = new_content
                    doc_modified = True
                else:
                    log.info("No <w:sdt> blocks found")

            if doc_modified:
                with open(doc_path, 'w', encoding='utf-8') as f:
                    f.write(doc_content)

            repackage_docx(tmp, output_path)

            output_size = os.path.getsize(output_path)
            log.info("Output: %s (%d bytes, %+d)", output_path, output_size, output_size - input_size)
            return True

    except Exception as e:
        log.exception("Error: %s", e)
        return False


def check_rtl(input_path: str) -> bool:
    """Open DOCX, read document.xml, return whether RTL content is present."""
    try:
        with zipfile.ZipFile(input_path, 'r') as z:
            with z.open('word/document.xml') as f:
                content = f.read().decode('utf-8')
        return has_rtl_content(content)
    except (KeyError, Exception) as e:
        log.warning("Could not check RTL: %s", e)
        return False


def main():
    parser = argparse.ArgumentParser(
        description="DOCX sanitizer for LibreOffice conversion issues")
    parser.add_argument("input", help="Input .docx file")
    parser.add_argument("output", nargs="?", default=None,
                        help="Output .docx (default: overwrite input)")
    parser.add_argument("-v", "--verbose", action="count", default=0)
    parser.add_argument("--mode", choices=["rtl", "sdt", "all"], default="all",
                        help="Sanitization mode: rtl (compat fix only), "
                             "sdt (unwrap only), all (default)")
    parser.add_argument("--check-rtl", action="store_true",
                        help="Check if document has RTL content and exit. "
                             "Prints 'true' or 'false' to stdout.")
    args = parser.parse_args()

    level = logging.WARNING
    if args.verbose >= 2:
        level = logging.DEBUG
    elif args.verbose >= 1:
        level = logging.INFO
    logging.basicConfig(level=level, format="%(levelname)-5s %(message)s",
                        stream=sys.stderr)

    if not os.path.exists(args.input):
        log.error("File not found: %s", args.input)
        sys.exit(1)

    if args.check_rtl:
        print("true" if check_rtl(args.input) else "false")
        sys.exit(0)

    output = args.output or args.input
    if output == args.input:
        temp_fd = None
        temp_path = None
        try:
            input_dir = os.path.dirname(os.path.abspath(args.input)) or "."
            temp_fd, temp_path = tempfile.mkstemp(
                suffix=".docx",
                prefix=".docx-sanitizer-",
                dir=input_dir,
            )
            os.close(temp_fd)
            temp_fd = None

            if sanitize_docx(args.input, temp_path, mode=args.mode):
                os.replace(temp_path, args.input)
                temp_path = None
                print(f"Sanitized DOCX written to: {args.input}")
            else:
                if temp_path and os.path.exists(temp_path):
                    os.remove(temp_path)
                sys.exit(1)
        except Exception as e:
            if temp_fd is not None:
                os.close(temp_fd)
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            log.exception("Error while sanitizing in place: %s", e)
            sys.exit(1)
    else:
        if sanitize_docx(args.input, output, mode=args.mode):
            print(f"Sanitized DOCX written to: {output}")
        else:
            sys.exit(1)


if __name__ == '__main__':
    main()
