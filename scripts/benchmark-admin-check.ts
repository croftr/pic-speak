
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function mockGetCards() {
  await delay(50); // Simulate database query latency
  return [{ id: '1', title: 'Card 1' }];
}

async function mockCheckIsAdmin() {
  await delay(200); // Simulate external API latency
  return false;
}

async function originalApproach() {
  const start = performance.now();
  const [cards, isAdmin] = await Promise.all([
    mockGetCards(),
    mockCheckIsAdmin()
  ]);
  // Use variables to avoid lint errors
  void cards;
  void isAdmin;
  const end = performance.now();
  return end - start;
}

async function optimizedApproach(isOwner: boolean) {
  const start = performance.now();

  const cardsPromise = mockGetCards();
  const isAdminPromise = isOwner ? Promise.resolve(false) : mockCheckIsAdmin();

  const [cards, isAdmin] = await Promise.all([
      cardsPromise,
      isAdminPromise
  ]);

  void cards;
  void isAdmin;

  const end = performance.now();
  return end - start;
}

async function runBenchmark() {
  console.log('Running benchmark for Board Page optimization...');
  const iterations = 10;

  // Measure Original Approach
  let totalOriginal = 0;
  for (let i = 0; i < iterations; i++) {
    totalOriginal += await originalApproach();
  }
  const avgOriginal = totalOriginal / iterations;
  console.log(`Original Approach (Avg over ${iterations} runs): ${avgOriginal.toFixed(2)}ms`);

  // Measure Optimized Approach (isOwner = true)
  let totalOptimizedOwner = 0;
  for (let i = 0; i < iterations; i++) {
    totalOptimizedOwner += await optimizedApproach(true);
  }
  const avgOptimizedOwner = totalOptimizedOwner / iterations;
  console.log(`Optimized Approach (Owner) (Avg over ${iterations} runs): ${avgOptimizedOwner.toFixed(2)}ms`);

  // Measure Optimized Approach (isOwner = false)
  let totalOptimizedNonOwner = 0;
  for (let i = 0; i < iterations; i++) {
    totalOptimizedNonOwner += await optimizedApproach(false);
  }
  const avgOptimizedNonOwner = totalOptimizedNonOwner / iterations;
  console.log(`Optimized Approach (Non-Owner) (Avg over ${iterations} runs): ${avgOptimizedNonOwner.toFixed(2)}ms`);

  const improvement = avgOriginal - avgOptimizedOwner;
  console.log(`\nImprovement for Owners: ${improvement.toFixed(2)}ms faster`);
}

runBenchmark();
