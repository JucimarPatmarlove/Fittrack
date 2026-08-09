async function test() {
  const url =
    'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
  console.log('Fetching', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('Total exercises:', data.length);
  console.log('First 3 exercises:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));
}

test().catch(console.error);
