// @ts-nocheck
export interface ExerciseMedia {
  imageUrl: string;
  gifUrl?: string;
  videoUrl?: string;
  instructions: string;
  tips: string[];
  muscleGroups: string[];
}

const toAssetSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getLocalImage = (name: string) => `/assets/exercises/images/${toAssetSlug(name)}.svg`;
const getLocalGif = (name: string) => `/assets/exercises/gifs/${toAssetSlug(name)}.gif`;

export const exerciseMediaMap: Record<string, ExerciseMedia> = {
  'Barbell Bench Press': {
    imageUrl: getLocalImage('Barbell Bench Press'),
    gifUrl: getLocalGif('Barbell Bench Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  'Barbell Incline Bench Press': {
    imageUrl: getLocalImage('Barbell Incline Bench Press'),
    gifUrl: getLocalGif('Barbell Incline Bench Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  'Dumbbell Bench Press': {
    imageUrl: getLocalImage('Dumbbell Bench Press'),
    gifUrl: getLocalGif('Dumbbell Bench Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  'Dumbbell Incline Bench Press': {
    imageUrl: getLocalImage('Dumbbell Incline Bench Press'),
    gifUrl: getLocalGif('Dumbbell Incline Bench Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  'Decline Bench Press': {
    imageUrl: getLocalImage('Decline Bench Press'),
    gifUrl: getLocalGif('Decline Bench Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  'Close-Grip Bench Press': {
    imageUrl: getLocalImage('Close-Grip Bench Press'),
    gifUrl: getLocalGif('Close-Grip Bench Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  'Cable Crossover': {
    imageUrl: getLocalImage('Cable Crossover'),
    gifUrl: getLocalGif('Cable Crossover'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  'Dumbbell Pullover': {
    imageUrl: getLocalImage('Dumbbell Pullover'),
    gifUrl: getLocalGif('Dumbbell Pullover'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  'Barbell Bent Over Row': {
    imageUrl: getLocalImage('Barbell Bent Over Row'),
    gifUrl: getLocalGif('Barbell Bent Over Row'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Dumbbell Row': {
    imageUrl: getLocalImage('Dumbbell Row'),
    gifUrl: getLocalGif('Dumbbell Row'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Single-Arm Dumbbell Row': {
    imageUrl: getLocalImage('Single-Arm Dumbbell Row'),
    gifUrl: getLocalGif('Single-Arm Dumbbell Row'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Cable Lat Pulldown Wide-Grip': {
    imageUrl: getLocalImage('Cable Lat Pulldown Wide-Grip'),
    gifUrl: getLocalGif('Cable Lat Pulldown Wide-Grip'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Close-Grip Pulldown': {
    imageUrl: getLocalImage('Close-Grip Pulldown'),
    gifUrl: getLocalGif('Close-Grip Pulldown'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Pull-Up': {
    imageUrl: getLocalImage('Pull-Up'),
    gifUrl: getLocalGif('Pull-Up'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Chin-Up': {
    imageUrl: getLocalImage('Chin-Up'),
    gifUrl: getLocalGif('Chin-Up'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Seated Cable Row': {
    imageUrl: getLocalImage('Seated Cable Row'),
    gifUrl: getLocalGif('Seated Cable Row'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'T-Bar Row': {
    imageUrl: getLocalImage('T-Bar Row'),
    gifUrl: getLocalGif('T-Bar Row'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Rack Pull': {
    imageUrl: getLocalImage('Rack Pull'),
    gifUrl: getLocalGif('Rack Pull'),
    instructions:
      'Mantenha a postura e contraia os músculos do costas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Costas'],
  },
  'Barbell Back Squat': {
    imageUrl: getLocalImage('Barbell Back Squat'),
    gifUrl: getLocalGif('Barbell Back Squat'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Front Squat': {
    imageUrl: getLocalImage('Front Squat'),
    gifUrl: getLocalGif('Front Squat'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Goblet Squat': {
    imageUrl: getLocalImage('Goblet Squat'),
    gifUrl: getLocalGif('Goblet Squat'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Barbell Deadlift': {
    imageUrl: getLocalImage('Barbell Deadlift'),
    gifUrl: getLocalGif('Barbell Deadlift'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Romanian Deadlift': {
    imageUrl: getLocalImage('Romanian Deadlift'),
    gifUrl: getLocalGif('Romanian Deadlift'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Sumo Deadlift': {
    imageUrl: getLocalImage('Sumo Deadlift'),
    gifUrl: getLocalGif('Sumo Deadlift'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Machine Leg Press': {
    imageUrl: getLocalImage('Machine Leg Press'),
    gifUrl: getLocalGif('Machine Leg Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Leg Extension': {
    imageUrl: getLocalImage('Leg Extension'),
    gifUrl: getLocalGif('Leg Extension'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Lying Leg Curl': {
    imageUrl: getLocalImage('Lying Leg Curl'),
    gifUrl: getLocalGif('Lying Leg Curl'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Seated Leg Curl': {
    imageUrl: getLocalImage('Seated Leg Curl'),
    gifUrl: getLocalGif('Seated Leg Curl'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Hip Thrust': {
    imageUrl: getLocalImage('Hip Thrust'),
    gifUrl: getLocalGif('Hip Thrust'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  Lunge: {
    imageUrl: getLocalImage('Lunge'),
    gifUrl: getLocalGif('Lunge'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Bulgarian Split Squat': {
    imageUrl: getLocalImage('Bulgarian Split Squat'),
    gifUrl: getLocalGif('Bulgarian Split Squat'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Standing Calf Raise': {
    imageUrl: getLocalImage('Standing Calf Raise'),
    gifUrl: getLocalGif('Standing Calf Raise'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Seated Calf Raise': {
    imageUrl: getLocalImage('Seated Calf Raise'),
    gifUrl: getLocalGif('Seated Calf Raise'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Box Jump': {
    imageUrl: getLocalImage('Box Jump'),
    gifUrl: getLocalGif('Box Jump'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Barbell Overhead Press': {
    imageUrl: getLocalImage('Barbell Overhead Press'),
    gifUrl: getLocalGif('Barbell Overhead Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Dumbbell Shoulder Press': {
    imageUrl: getLocalImage('Dumbbell Shoulder Press'),
    gifUrl: getLocalGif('Dumbbell Shoulder Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Arnold Press': {
    imageUrl: getLocalImage('Arnold Press'),
    gifUrl: getLocalGif('Arnold Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Dumbbell Lateral Raise': {
    imageUrl: getLocalImage('Dumbbell Lateral Raise'),
    gifUrl: getLocalGif('Dumbbell Lateral Raise'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Front Raise': {
    imageUrl: getLocalImage('Front Raise'),
    gifUrl: getLocalGif('Front Raise'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Face Pull': {
    imageUrl: getLocalImage('Face Pull'),
    gifUrl: getLocalGif('Face Pull'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Upright Row': {
    imageUrl: getLocalImage('Upright Row'),
    gifUrl: getLocalGif('Upright Row'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Reverse Pec Deck': {
    imageUrl: getLocalImage('Reverse Pec Deck'),
    gifUrl: getLocalGif('Reverse Pec Deck'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Barbell Shrug': {
    imageUrl: getLocalImage('Barbell Shrug'),
    gifUrl: getLocalGif('Barbell Shrug'),
    instructions:
      'Mantenha a postura e contraia os músculos do ombros. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Ombros'],
  },
  'Barbell Bicep Curl': {
    imageUrl: getLocalImage('Barbell Bicep Curl'),
    gifUrl: getLocalGif('Barbell Bicep Curl'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Alternating Dumbbell Curl': {
    imageUrl: getLocalImage('Alternating Dumbbell Curl'),
    gifUrl: getLocalGif('Alternating Dumbbell Curl'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Hammer Curl': {
    imageUrl: getLocalImage('Hammer Curl'),
    gifUrl: getLocalGif('Hammer Curl'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Concentration Curl': {
    imageUrl: getLocalImage('Concentration Curl'),
    gifUrl: getLocalGif('Concentration Curl'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Preacher Curl': {
    imageUrl: getLocalImage('Preacher Curl'),
    gifUrl: getLocalGif('Preacher Curl'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Cable Rope Tricep Pushdown': {
    imageUrl: getLocalImage('Cable Rope Tricep Pushdown'),
    gifUrl: getLocalGif('Cable Rope Tricep Pushdown'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Skull Crusher': {
    imageUrl: getLocalImage('Skull Crusher'),
    gifUrl: getLocalGif('Skull Crusher'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Triceps Pushdown': {
    imageUrl: getLocalImage('Triceps Pushdown'),
    gifUrl: getLocalGif('Triceps Pushdown'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Overhead Triceps Extension': {
    imageUrl: getLocalImage('Overhead Triceps Extension'),
    gifUrl: getLocalGif('Overhead Triceps Extension'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Diamond Push-Up': {
    imageUrl: getLocalImage('Diamond Push-Up'),
    gifUrl: getLocalGif('Diamond Push-Up'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  'Bench Dip': {
    imageUrl: getLocalImage('Bench Dip'),
    gifUrl: getLocalGif('Bench Dip'),
    instructions:
      'Mantenha a postura e contraia os músculos do braços. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Braços'],
  },
  Plank: {
    imageUrl: getLocalImage('Plank'),
    gifUrl: getLocalGif('Plank'),
    instructions:
      'Mantenha a postura e contraia os músculos do core. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Core'],
  },
  'Side Plank': {
    imageUrl: getLocalImage('Side Plank'),
    gifUrl: getLocalGif('Side Plank'),
    instructions:
      'Mantenha a postura e contraia os músculos do core. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Core'],
  },
  Crunch: {
    imageUrl: getLocalImage('Crunch'),
    gifUrl: getLocalGif('Crunch'),
    instructions:
      'Mantenha a postura e contraia os músculos do core. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Core'],
  },
  'Cable Crunch': {
    imageUrl: getLocalImage('Cable Crunch'),
    gifUrl: getLocalGif('Cable Crunch'),
    instructions:
      'Mantenha a postura e contraia os músculos do core. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Core'],
  },
  'Hanging Leg Raise': {
    imageUrl: getLocalImage('Hanging Leg Raise'),
    gifUrl: getLocalGif('Hanging Leg Raise'),
    instructions:
      'Mantenha a postura e contraia os músculos do core. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Core'],
  },
  'Russian Twist': {
    imageUrl: getLocalImage('Russian Twist'),
    gifUrl: getLocalGif('Russian Twist'),
    instructions:
      'Mantenha a postura e contraia os músculos do core. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Core'],
  },
  'Pallof Press': {
    imageUrl: getLocalImage('Pallof Press'),
    gifUrl: getLocalGif('Pallof Press'),
    instructions:
      'Mantenha a postura e contraia os músculos do core. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Core'],
  },
  'Lying Leg Raise': {
    imageUrl: getLocalImage('Lying Leg Raise'),
    gifUrl: getLocalGif('Lying Leg Raise'),
    instructions:
      'Mantenha a postura e contraia os músculos do core. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Core'],
  },
  'Push-Up': {
    imageUrl: getLocalImage('Push-Up'),
    gifUrl: getLocalGif('Push-Up'),
    instructions:
      'Mantenha a postura e contraia os músculos do peito. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Peito'],
  },
  Burpee: {
    imageUrl: getLocalImage('Burpee'),
    gifUrl: getLocalGif('Burpee'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  Dips: {
    imageUrl: getLocalImage('Dips'),
    gifUrl: getLocalGif('Dips'),
    instructions:
      'Mantenha a postura e contraia os músculos do tríceps. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Tríceps'],
  },
  'Kettlebell Swing': {
    imageUrl: getLocalImage('Kettlebell Swing'),
    gifUrl: getLocalGif('Kettlebell Swing'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Power Clean': {
    imageUrl: getLocalImage('Power Clean'),
    gifUrl: getLocalGif('Power Clean'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  'Jump Squat': {
    imageUrl: getLocalImage('Jump Squat'),
    gifUrl: getLocalGif('Jump Squat'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Box Step-Up': {
    imageUrl: getLocalImage('Box Step-Up'),
    gifUrl: getLocalGif('Box Step-Up'),
    instructions:
      'Mantenha a postura e contraia os músculos do pernas. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Pernas'],
  },
  'Clean and Jerk': {
    imageUrl: getLocalImage('Clean and Jerk'),
    gifUrl: getLocalGif('Clean and Jerk'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  Snatch: {
    imageUrl: getLocalImage('Snatch'),
    gifUrl: getLocalGif('Snatch'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  Thruster: {
    imageUrl: getLocalImage('Thruster'),
    gifUrl: getLocalGif('Thruster'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  'Farmers Walk': {
    imageUrl: getLocalImage('Farmers Walk'),
    gifUrl: getLocalGif('Farmers Walk'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  'Sled Push': {
    imageUrl: getLocalImage('Sled Push'),
    gifUrl: getLocalGif('Sled Push'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  'Medicine Ball Slam': {
    imageUrl: getLocalImage('Medicine Ball Slam'),
    gifUrl: getLocalGif('Medicine Ball Slam'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  'Battle Ropes': {
    imageUrl: getLocalImage('Battle Ropes'),
    gifUrl: getLocalGif('Battle Ropes'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
  'Sandbag Carry': {
    imageUrl: getLocalImage('Sandbag Carry'),
    gifUrl: getLocalGif('Sandbag Carry'),
    instructions:
      'Mantenha a postura e contraia os músculos do full body. Execute o movimento de forma controlada.',
    tips: [
      'Mantenha a respiração estável',
      'Foque na fase excêntrica',
      'Não compense com outros músculos',
    ],
    muscleGroups: ['Full Body'],
  },
};

const placeholderSvg = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDgwYjBmMjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2U4Yzg0YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7wn4+L7b+9IFNlbSBJbWFnZW08L3RleHQ+PC9zdmc+`;

const SYNONYMS: Record<string, string> = {
  'supino plano': 'Barbell Bench Press',
  'supino reto': 'Barbell Bench Press',
  'spoto press': 'Barbell Bench Press',
  'supino inclinado': 'Barbell Incline Bench Press',
  agachamento: 'Barbell Back Squat',
  'agachamento livre': 'Barbell Back Squat',
  'bodyweight squat': 'Goblet Squat',
  'peso morto': 'Barbell Deadlift',
  'levantamento terra': 'Barbell Deadlift',
  desenvolvimento: 'Barbell Overhead Press',
  'press militar': 'Barbell Overhead Press',
  'remada curvada': 'Barbell Bent Over Row',
  'remada unilateral': 'Single-Arm Dumbbell Row',
  'puxada frontal': 'Cable Lat Pulldown Wide-Grip',
  'cable lat pull down wide-grip': 'Cable Lat Pulldown Wide-Grip',
  'leg press': 'Machine Leg Press',
  'cadeira extensora': 'Leg Extension',
  'mesa flexora': 'Lying Leg Curl',
  crossover: 'Cable Crossover',
  'dumbbell flyes': 'Cable Crossover',
  'floor press': 'Dumbbell Bench Press',
  superman: 'Plank',
  lunges: 'Lunge',
  'lunges alternados': 'Lunge',
  'agachamento búlgaro': 'Bulgarian Split Squat',
  'romanian deadlift c/ halteres': 'Romanian Deadlift',
  'rosca direta': 'Barbell Bicep Curl',
  'tríceps corda': 'Cable Rope Tricep Pushdown',
  'tríceps testa': 'Skull Crusher',
  'tríceps testa (halter)': 'Overhead Triceps Extension',
  'dips (cadeira)': 'Bench Dip',
  'cable row': 'Seated Cable Row',
  'leg raises': 'Lying Leg Raise',
  'ab wheel': 'Plank',
  'peck deck': 'Reverse Pec Deck',
  'jumping jacks': 'Burpee',
  'mountain climbers': 'Plank',
  'high knees': 'Burpee',
  'shadow boxing': 'Battle Ropes',
  'plank jacks': 'Plank',
  'squat jumps': 'Jump Squat',
  'box jumps': 'Box Jump',
  'kettlebell swings': 'Kettlebell Swing',
  'barra fixa': 'Pull-Up',
  fundos: 'Dips',
  flexões: 'Push-Up',
  abdominais: 'Crunch',
  burpees: 'Burpee',
  'calf raise': 'Standing Calf Raise',
  'elevação lateral': 'Dumbbell Lateral Raise',
  'elevação frontal': 'Front Raise',
};

export function getExerciseMedia(exerciseName: string): ExerciseMedia {
  const cleanName = exerciseName.trim().toLowerCase();

  // Resolve synonyms/translations
  const resolvedName = SYNONYMS[cleanName] || exerciseName;
  const name = resolvedName.toLowerCase();

  const exactMatchKey = Object.keys(exerciseMediaMap).find((k) => k.toLowerCase() === name);
  if (exactMatchKey) return exerciseMediaMap[exactMatchKey];

  const partialMatchKey = Object.keys(exerciseMediaMap).find(
    (k) => k.toLowerCase().includes(name) || name.includes(k.toLowerCase()),
  );
  if (partialMatchKey) return exerciseMediaMap[partialMatchKey];

  // Try matching components/subwords if still not found
  // (e.g. "Supino Inclinado com Halteres" -> contains "supino inclinado")
  const subMatchKey = Object.keys(SYNONYMS).find(
    (syn) => cleanName.includes(syn) || syn.includes(cleanName),
  );
  if (subMatchKey) {
    const mapped = SYNONYMS[subMatchKey];
    const exactMappedKey = Object.keys(exerciseMediaMap).find(
      (k) => k.toLowerCase() === mapped.toLowerCase(),
    );
    if (exactMappedKey) return exerciseMediaMap[exactMappedKey];
  }

  return {
    imageUrl: placeholderSvg,
    instructions: 'Instruções completas ainda não registadas.',
    tips: ['Mantenha a forma correta'],
    muscleGroups: ['Vários'],
  };
}
