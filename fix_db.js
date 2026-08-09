import fs from 'fs';

const content = fs.readFileSync('src/data/exerciseDB.ts', 'utf-8');
const newContent = content.replace(
  /export const EXERCISE_DB: Record<string, any> = \{([\s\S]*)\};/m,
  (match, body) => {
    const lines = body.split('\n');
    const newLines = lines.map((line) => {
      if (!line.trim() || line.trim() === '') return line;

      let type = '"weighted"';
      if (line.includes('equipment: "PesoCorporal"')) {
        if (line.includes('Plank') || line.includes('Stomach Vacuum')) type = '"timed"';
        else type = '"bodyweight"';
      } else if (line.includes('equipment: "Kettlebell"')) {
        type = '"weighted"'; // or kettlebell
      }

      // Insert type before base:
      if (line.includes('base: {') && !line.includes('type:')) {
        return line.replace('base: {', `type: ${type}, base: {`);
      }
      return line;
    });

    // Add new cardio exercises
    if (!newLines.some((l) => l.includes('"Running"'))) {
      newLines.push(
        `  "Running": { muscle: "Cardio", equipment: "Nenhum", type: "cardio", base: { hipertrofia: [] } },`,
      );
      newLines.push(
        `  "Cycling": { muscle: "Cardio", equipment: "Nenhum", type: "cardio", base: { hipertrofia: [] } },`,
      );
      newLines.push(
        `  "Rowing": { muscle: "Cardio", equipment: "Máquinas", type: "cardio", base: { hipertrofia: [] } },`,
      );
    }

    return `export const EXERCISE_DB: Record<string, any> = {\n${newLines.join('\n')}\n};`;
  },
);

fs.writeFileSync('src/data/exerciseDB.ts', newContent);
console.log('Done!');
