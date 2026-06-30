// Static workout data: exercise pools per muscle group, goal-based rep schemes, fixed warmup/abs.

// Maps our exercise names to the free-exercise-db (public domain) image path.
// Source: https://github.com/yuhonas/free-exercise-db
const EXERCISE_IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const EXERCISE_IMAGES = {
  "Bench press": "Barbell_Bench_Press_-_Medium_Grip/0.jpg",
  "Incline dumbbell press": "Incline_Dumbbell_Press/0.jpg",
  "Cable flys": "Flat_Bench_Cable_Flyes/0.jpg",
  "Dumbbell flat press": "Dumbbell_Bench_Press/0.jpg",
  "Machine chest press": "Machine_Bench_Press/0.jpg",
  "Push-ups": "Push-Ups_With_Feet_Elevated/0.jpg",
  "Decline barbell press": "Decline_Barbell_Bench_Press/0.jpg",
  "Cable crossover": "Cable_Crossover/0.jpg",

  "Lat pulldown": "Wide-Grip_Lat_Pulldown/0.jpg",
  "Seated cable row": "Seated_Cable_Rows/0.jpg",
  "Pull-ups": "Wide-Grip_Rear_Pull-Up/0.jpg",
  "Bent-over barbell row": "Bent_Over_Barbell_Row/0.jpg",
  "Single-arm dumbbell row": "One-Arm_Dumbbell_Row/0.jpg",
  "T-bar row": "T-Bar_Row_with_Handle/0.jpg",
  "Straight-arm pulldown": "Straight-Arm_Pulldown/0.jpg",
  "Face pulls": "Face_Pull/0.jpg",

  "Overhead barbell press": "Barbell_Shoulder_Press/0.jpg",
  "Dumbbell shoulder press": "Dumbbell_Shoulder_Press/0.jpg",
  "Lateral raises": "Side_Lateral_Raise/0.jpg",
  "Front raises": "Front_Dumbbell_Raise/0.jpg",
  "Rear delt flys": "Cable_Rear_Delt_Fly/0.jpg",
  "Arnold press": "Arnold_Dumbbell_Press/0.jpg",
  "Cable lateral raise": "Cable_Seated_Lateral_Raise/0.jpg",
  "Upright row": "Upright_Barbell_Row/0.jpg",

  "Barbell curl": "Barbell_Curl/0.jpg",
  "Dumbbell curl": "Dumbbell_Bicep_Curl/0.jpg",
  "Hammer curl": "Hammer_Curls/0.jpg",
  "Cable curl": "Standing_Biceps_Cable_Curl/0.jpg",
  "Preacher curl": "Preacher_Curl/0.jpg",
  "Concentration curl": "Concentration_Curls/0.jpg",
  "Incline dumbbell curl": "Incline_Dumbbell_Curl/0.jpg",
  "EZ-bar curl": "EZ-Bar_Curl/0.jpg",

  "Tricep pushdown": "Triceps_Pushdown/0.jpg",
  "Skull crushers": "EZ-Bar_Skullcrusher/0.jpg",
  "Overhead dumbbell extension": "Standing_Dumbbell_Triceps_Extension/0.jpg",
  "Dips": "Dips_-_Triceps_Version/0.jpg",
  "Close-grip bench press": "Close-Grip_Barbell_Bench_Press/0.jpg",
  "Rope kickbacks": "Tricep_Dumbbell_Kickback/0.jpg",
  "Diamond push-ups": "Push-Ups_-_Close_Triceps_Position/0.jpg",
  "Cable overhead extension": "Cable_Rope_Overhead_Triceps_Extension/0.jpg",

  "Barbell squat": "Barbell_Squat/0.jpg",
  "Leg press": "Leg_Press/0.jpg",
  "Romanian deadlift": "Romanian_Deadlift/0.jpg",
  "Walking lunges": "Barbell_Walking_Lunge/0.jpg",
  "Leg extension": "Leg_Extensions/0.jpg",
  "Leg curl": "Lying_Leg_Curls/0.jpg",
  "Bulgarian split squat": "Split_Squat_with_Dumbbells/0.jpg",
  "Calf raises": "Standing_Calf_Raises/0.jpg",
  "Hip thrust": "Barbell_Hip_Thrust/0.jpg",

  "Hanging leg raises": "Hanging_Leg_Raise/0.jpg",
  "Cable crunch": "Cable_Crunch/0.jpg",
  "Ab wheel rollout": "Ab_Roller/0.jpg",
  "Decline sit-ups": "Sit-Up/0.jpg",
  "Weighted Russian twists": "Russian_Twist/0.jpg",
  "Plank variations": "Plank/0.jpg",
  "Med ball slams": "Overhead_Slam/0.jpg",

  "Treadmill run/incline walk": "Running_Treadmill/0.jpg",
  "Stationary bike intervals": "Recumbent_Bike/0.jpg",
  "Rowing machine": "Rowing_Stationary/0.jpg",
  "Stair climber": "Stairmaster/0.jpg",
  "Elliptical steady state": "Elliptical_Trainer/0.jpg",

  "Hamstring stretch (each leg)": "Hamstring_Stretch/0.jpg",
  "Hip flexor stretch (each side)": "Standing_Hip_Flexors/0.jpg",
  "Shoulder/chest doorway stretch": "Chest_And_Front_Of_Shoulder_Stretch/0.jpg",
  "90/90 hip mobility flow": "90_90_Hamstring/0.jpg",
  "Standing quad stretch (each leg)": "Standing_Elevated_Quad_Stretch/0.jpg",

  "Plank": "Plank/0.jpg",
  "Bicycle crunches": "Crunches/0.jpg",
  "Leg raises": "Hanging_Leg_Raise/0.jpg",
  "Russian twists": "Russian_Twist/0.jpg",
  "Crunches": "Crunches/0.jpg",
  "Mountain climbers": "Mountain_Climbers/0.jpg",
  "Flutter kicks": "Flutter_Kicks/0.jpg",
  "Hanging knee raises": "Hanging_Leg_Raise/0.jpg",
  "Cable crunches": "Cable_Crunch/0.jpg",
  "Sit-ups": "Sit-Up/0.jpg",
  "Toe touches": "Standing_Toe_Touches/0.jpg",
  "Reverse crunches": "Reverse_Crunch/0.jpg"
};

function getExerciseImage(name) {
  const path = EXERCISE_IMAGES[name];
  return path ? EXERCISE_IMAGE_BASE + path : null;
}

const GOAL_LABELS = {
  build_muscle: "Build Muscle",
  lose_weight: "Lose Weight",
  gain_weight: "Gain Weight",
  tone: "Tone / Lean Out",
  mobility: "Improve Mobility / Flexibility"
};

// scheme used for standard weighted/bodyweight strength exercises
const GOAL_SCHEMES = {
  build_muscle: { sets: 4, reps: "6-10", rest: "90s" },
  gain_weight:  { sets: 4, reps: "8-12", rest: "90-120s" },
  tone:         { sets: 3, reps: "12-15", rest: "60s" },
  lose_weight:  { sets: 3, reps: "15-20", rest: "30s (circuit)" }
};
const DEFAULT_SCHEME = { sets: 3, reps: "10-12", rest: "60s" };

// priority order when multiple goals are selected (first match wins for strength scheme)
const GOAL_PRIORITY = ["lose_weight", "build_muscle", "gain_weight", "tone"];

function pickScheme(goals) {
  for (const g of GOAL_PRIORITY) {
    if (goals.includes(g)) return GOAL_SCHEMES[g];
  }
  return DEFAULT_SCHEME;
}

// Fixed, always-first block
const WARMUP_BLOCK = [
  { exercise: "Dynamic warm-up stretch (full body)", duration: "10 min" }
];
const ABS_BLOCK_POOL = [
  ["Plank", "Bicycle crunches", "Leg raises", "Russian twists"],
  ["Crunches", "Mountain climbers", "Flutter kicks", "Side plank (each side)"],
  ["Hanging knee raises", "V-ups", "Cable crunches", "Plank"],
  ["Sit-ups", "Toe touches", "Reverse crunches", "Russian twists"]
];

// Exercise pools per muscle group — standard commercial/apartment gym equipment.
// Each pool has enough entries to rotate through distinct subsets week to week.
const MUSCLE_GROUPS = {
  chest: {
    label: "Chest",
    pool: ["Bench press", "Incline dumbbell press", "Cable flys", "Dumbbell flat press",
           "Machine chest press", "Push-ups", "Decline barbell press", "Cable crossover"]
  },
  back: {
    label: "Back",
    pool: ["Lat pulldown", "Seated cable row", "Pull-ups", "Bent-over barbell row",
           "Single-arm dumbbell row", "T-bar row", "Straight-arm pulldown", "Face pulls"]
  },
  shoulders: {
    label: "Shoulders",
    pool: ["Overhead barbell press", "Dumbbell shoulder press", "Lateral raises",
           "Front raises", "Rear delt flys", "Arnold press", "Cable lateral raise", "Upright row"]
  },
  biceps: {
    label: "Biceps",
    pool: ["Barbell curl", "Dumbbell curl", "Hammer curl", "Cable curl",
           "Preacher curl", "Concentration curl", "Incline dumbbell curl", "EZ-bar curl"]
  },
  triceps: {
    label: "Triceps",
    pool: ["Tricep pushdown", "Skull crushers", "Overhead dumbbell extension", "Dips",
           "Close-grip bench press", "Rope kickbacks", "Diamond push-ups", "Cable overhead extension"]
  },
  legs: {
    label: "Legs",
    pool: ["Barbell squat", "Leg press", "Romanian deadlift", "Walking lunges",
           "Leg extension", "Leg curl", "Bulgarian split squat", "Calf raises", "Hip thrust"]
  },
  abs: {
    label: "Abs (Bonus)",
    pool: ["Hanging leg raises", "Cable crunch", "Ab wheel rollout", "Decline sit-ups",
           "Weighted Russian twists", "Dragon flag", "Plank variations", "Med ball slams"]
  },
  cardio: {
    label: "Cardio",
    isTimed: true,
    pool: [
      { exercise: "Treadmill run/incline walk", duration: "15-20 min" },
      { exercise: "Stationary bike intervals", duration: "15-20 min" },
      { exercise: "Jump rope", duration: "10 min" },
      { exercise: "Rowing machine", duration: "12-15 min" },
      { exercise: "Stair climber", duration: "12-15 min" },
      { exercise: "Elliptical steady state", duration: "20 min" }
    ]
  },
  stretch: {
    label: "Stretch / Mobility",
    isTimed: true,
    pool: [
      { exercise: "Hamstring stretch (each leg)", duration: "45 sec" },
      { exercise: "Hip flexor stretch (each side)", duration: "45 sec" },
      { exercise: "Shoulder/chest doorway stretch", duration: "45 sec" },
      { exercise: "Cat-cow + spinal twist flow", duration: "3 min" },
      { exercise: "Pigeon pose (each side)", duration: "45 sec" },
      { exercise: "Foam rolling — full body", duration: "8 min" },
      { exercise: "90/90 hip mobility flow", duration: "5 min" },
      { exercise: "Standing quad stretch (each leg)", duration: "45 sec" }
    ]
  }
};

const MUSCLE_GROUP_ORDER = ["chest", "back", "shoulders", "biceps", "triceps", "legs", "abs", "cardio", "stretch"];

const MISS_REASONS = [
  { id: "lazy", label: "Lazy" },
  { id: "sick", label: "Sick" },
  { id: "traveling", label: "Traveling" },
  { id: "hungover", label: "Hungover" },
  { id: "other", label: "Other" }
];

function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Rotate exercise selection within a pool based on week number, picking `count` items.
function rotatedSubset(pool, count, weekNum, offset) {
  const n = pool.length;
  if (n === 0) return [];
  const start = ((weekNum + offset) * count) % n;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[(start + i) % n]);
  }
  return result;
}

/**
 * Generate today's plan for the selected muscle groups, given the user's goals.
 * Returns an array of plan items: { group, exercise, sets, reps, rest } or { group, exercise, duration } for timed.
 */
function generatePlan(groupIds, goals, weekNum) {
  const scheme = pickScheme(goals);
  const includeMobility = goals.includes("mobility");
  const numGroups = groupIds.length || 1;
  // scale exercises-per-group down as more groups are picked, to stay within ~45-60 min
  const perGroupCount = numGroups <= 1 ? 4 : numGroups === 2 ? 3 : numGroups === 3 ? 2 : 2;

  const plan = [];
  groupIds.forEach((gid, idx) => {
    const group = MUSCLE_GROUPS[gid];
    if (!group) return;
    if (group.isTimed) {
      const items = rotatedSubset(group.pool, gid === "cardio" ? 2 : 3, weekNum, idx);
      items.forEach(item => plan.push({ group: gid, exercise: item.exercise, duration: item.duration }));
    } else {
      const items = rotatedSubset(group.pool, perGroupCount, weekNum, idx);
      items.forEach(ex => plan.push({ group: gid, exercise: ex, sets: scheme.sets, reps: scheme.reps, rest: scheme.rest }));
    }
  });

  // Mobility goal layers in extra stretch items if "stretch" wasn't already picked
  if (includeMobility && !groupIds.includes("stretch")) {
    const items = rotatedSubset(MUSCLE_GROUPS.stretch.pool, 2, weekNum, 99);
    items.forEach(item => plan.push({ group: "stretch", exercise: item.exercise, duration: item.duration }));
  }

  return plan;
}

function getAbsBlock(weekNum) {
  return ABS_BLOCK_POOL[weekNum % ABS_BLOCK_POOL.length];
}
