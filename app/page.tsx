export default async function Home() {
  const res = await fetch("http://localhost:3000/api/todos", {
    cache: "no-store",
  });
  const { data } = await res.json();

  return (
    <main style={{ padding: 24 }}>
      <h1>Todos</h1>
      <ul>
        {data?.map((t: any) => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
    </main>
  );
}