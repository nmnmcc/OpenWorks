import Link from "next/link";

export default function Home() {
	return (
		<main style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
			<h1>OpenWorks</h1>
			<p>Effect + React best practices with Next.js 16</p>
			<nav>
				<ul style={{ listStyle: "none", padding: 0 }}>
					<li>
						<Link href="/todos" style={{ color: "#0070f3" }}>
							Todo App (Suspense pattern)
						</Link>
					</li>
					<li style={{ marginTop: "0.5rem" }}>
						<Link href="/todos-manual" style={{ color: "#0070f3" }}>
							Todo App (Manual AsyncResult pattern)
						</Link>
					</li>
				</ul>
			</nav>
		</main>
	);
}
