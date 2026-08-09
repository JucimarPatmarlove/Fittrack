import re

def extract_new_content(patch_file, target_file):
    with open(patch_file, 'r') as f:
        content = f.read()

    diffs = content.split('diff --git ')
    for diff in diffs:
        if not diff.startswith(f'a/{target_file}'):
            continue
        
        lines = diff.split('\n')
        hunk_start = 0
        for i, line in enumerate(lines):
            if line.startswith('@@'):
                hunk_start = i
                break
                
        out_lines = []
        for line in lines[hunk_start:]:
            if line.startswith('+') and not line.startswith('+++'):
                out_lines.append(line[1:])
            elif line.startswith(' '):
                out_lines.append(line[1:])
            elif line.startswith('@@') or line.startswith('\\ No newline'):
                pass
                
        with open(target_file, 'w') as f:
            f.write('\n'.join(out_lines))

extract_new_content('social.patch', 'src/stores/useSocialStore.ts')
