/**
 * RippleRoute — Quantum-behaved Particle Swarm Optimization (QPSO)
 *
 * Implements real delta-potential well Quantum PSO algorithm
 * for multidimensional continuous fitness landscape optimization.
 */

function createPrng(seed) {
  if (typeof seed === "number" && !isNaN(seed)) {
    let s = seed >>> 0;
    return function mulberry32() {
      let t = (s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  return Math.random;
}

/**
 * Run Quantum-behaved Particle Swarm Optimization
 * @param {Object} options
 * @param {number} options.dim - Dimension of search space
 * @param {Array<[number, number]> | Array<{min: number, max: number}>} options.bounds - Min and max per dimension
 * @param {Function} options.fitness - Fitness function (f(x) => number, minimized)
 * @param {number} [options.particles=30] - Swarm population size
 * @param {number} [options.iterations=60] - Number of optimization generations
 * @param {number} [options.seed] - Seed for repeatable PRNG (mulberry32)
 * @returns {{ best: number[], bestFitness: number, history: number[] }}
 */
export function qpso({
  dim = 2,
  bounds,
  fitness,
  particles = 30,
  iterations = 60,
  seed,
}) {
  if (typeof fitness !== "function") {
    throw new Error("qpso requires a fitness evaluation function");
  }

  const rand = createPrng(seed);

  // Normalize bounds to [[min, max], ...]
  const normBounds = [];
  for (let d = 0; d < dim; d++) {
    const b = bounds?.[d];
    if (Array.isArray(b)) {
      normBounds.push([b[0], b[1]]);
    } else if (b && typeof b.min === "number" && typeof b.max === "number") {
      normBounds.push([b.min, b.max]);
    } else {
      normBounds.push([-10, 10]);
    }
  }

  // 1. Initialize particle positions uniformly in bounds
  const x = [];
  const pbest = [];
  const pbestFitness = [];
  let gbest = null;
  let bestFitness = Infinity;

  for (let i = 0; i < particles; i++) {
    const pos = new Array(dim);
    for (let d = 0; d < dim; d++) {
      const [bMin, bMax] = normBounds[d];
      pos[d] = bMin + rand() * (bMax - bMin);
    }
    x.push(pos);
    pbest.push([...pos]);

    const f = fitness(pos);
    pbestFitness.push(f);

    if (f < bestFitness) {
      bestFitness = f;
      gbest = [...pos];
    }
  }

  const history = [bestFitness];

  // 2. Iterate generations t = 0 ... iterations - 1
  for (let t = 0; t < iterations; t++) {
    // Contraction-expansion coefficient beta decreasing from 1.0 to 0.5
    const beta = 1.0 - 0.5 * (t / iterations);

    // Compute mbest (mean of all pbest positions)
    const mbest = new Array(dim).fill(0);
    for (let d = 0; d < dim; d++) {
      let sum = 0;
      for (let i = 0; i < particles; i++) {
        sum += pbest[i][d];
      }
      mbest[d] = sum / particles;
    }

    // Update each particle along each dimension
    for (let i = 0; i < particles; i++) {
      for (let d = 0; d < dim; d++) {
        const phi = rand();
        const p = phi * pbest[i][d] + (1 - phi) * gbest[d];
        const u = Math.max(rand(), 1e-12);
        const step = beta * Math.abs(mbest[d] - x[i][d]) * Math.log(1 / u);

        x[i][d] = rand() < 0.5 ? p + step : p - step;

        // Clamp to search space bounds
        const [bMin, bMax] = normBounds[d];
        x[i][d] = Math.max(bMin, Math.min(bMax, x[i][d]));
      }

      // Evaluate new position
      const f = fitness(x[i]);
      if (f < pbestFitness[i]) {
        pbestFitness[i] = f;
        pbest[i] = [...x[i]];

        if (f < bestFitness) {
          bestFitness = f;
          gbest = [...x[i]];
        }
      }
    }

    history.push(Number(bestFitness.toFixed(4)));
  }

  return {
    best: gbest,
    bestFitness,
    history,
  };
}
