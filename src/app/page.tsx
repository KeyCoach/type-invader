// app/page.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically import the component with SSR disabled
const TypingAsteroids = dynamic(() => import("../components/TypingAsteroids"), {
	ssr: false,
});

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center">
			<TypingAsteroids />
		</main>
	);
}
