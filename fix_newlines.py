import os

files = [
    "src/data/exerciseDB.ts",
    "src/data/exerciseClassifier.ts",
    "src/data/exerciseMedia.ts",
    "scripts/downloadExerciseMedia.js"
]

for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    content = content.replace("\\n", "\n")
    
    with open(file, "w") as f:
        f.write(content)
