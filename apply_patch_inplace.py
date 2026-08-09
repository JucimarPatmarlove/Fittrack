import sys
import re

def apply_patch():
    patch_file = "social.patch"
    with open(patch_file, 'r') as f:
        content = f.read()

    # We can split by diff --git
    diffs = content.split('diff --git ')[1:]
    
    for diff in diffs:
        lines = diff.split('\n')
        header_files = lines[0].split(' ')
        a_file = header_files[0][2:] # strip a/
        b_file = header_files[1][2:] # strip b/
        
        # find the start of hunks
        hunk_start = 0
        for i, line in enumerate(lines):
            if line.startswith('@@'):
                hunk_start = i
                break
        
        is_new = any(l.startswith('new file mode') for l in lines[:hunk_start])
        is_del = any(l.startswith('deleted file mode') for l in lines[:hunk_start])
        
        if is_del:
            import os
            try:
                # We might not be able to unlink, so we just clear it
                open(b_file, 'w').write('')
            except Exception as e:
                print(f"Failed to clear {b_file}: {e}")
            continue

        if is_new:
            out_lines = []
            for line in lines[hunk_start:]:
                if line.startswith('+') and not line.startswith('+++'):
                    out_lines.append(line[1:])
                elif line.startswith(' '):
                    out_lines.append(line[1:])
                elif line.startswith('@@') or line.startswith('\\ No newline'):
                    pass
            
            import os
            os.makedirs(os.path.dirname(b_file), exist_ok=True)
            with open(b_file, 'w') as f:
                f.write('\n'.join(out_lines))
            continue
            
        # modification
        print(f"Need manual apply for {b_file}")

if __name__ == "__main__":
    apply_patch()
