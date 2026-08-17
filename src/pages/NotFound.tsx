import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";

const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
	id: i,
	left: `${8 + (i * 9) % 84}%`,
	delay: i * 0.65,
	duration: 4 + (i % 4),
	size: [5, 4, 3, 6, 4][i % 5],
}));

const DIGIT_FLOAT = (i: number) => ({
	animate: { y: [0, i === 1 ? 14 : -14, 0] },
	transition: { duration: 2.8, delay: i * 0.22, repeat: Infinity, ease: "easeInOut" as const },
});

export default function NotFound() {
	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
			{/* Background blobs */}
			<motion.div
				className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-primary/[0.06]"
				animate={{ scale: [1, 1.18, 1], opacity: [0.5, 1, 0.5] }}
				transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
			/>
			<motion.div
				className="absolute -bottom-56 -right-40 h-[560px] w-[560px] rounded-full bg-primary/[0.06]"
				animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.9, 0.4] }}
				transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
			/>

			{/* Rotating rings */}
			<motion.div
				className="absolute h-[640px] w-[640px] rounded-full border border-primary/10"
				animate={{ rotate: 360 }}
				transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
			/>
			<motion.div
				className="absolute h-[420px] w-[420px] rounded-full border border-primary/[0.12]"
				animate={{ rotate: -360 }}
				transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
			/>
			<motion.div
				className="absolute h-[200px] w-[200px] rounded-full border border-primary/20"
				animate={{ rotate: 360 }}
				transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
			/>

			{/* Rising particles */}
			{PARTICLES.map((p) => (
				<motion.div
					key={p.id}
					className="absolute bottom-0 rounded-full bg-primary/25"
					style={{ left: p.left, width: p.size, height: p.size }}
					animate={{ y: [0, -700], opacity: [0, 0.7, 0] }}
					transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
				/>
			))}

			{/* Content */}
			<div className="relative z-10 flex flex-col items-center px-6 text-center">
				{/* 404 */}
				<div className="mb-6 flex items-end gap-1 sm:gap-2">
					{["4", "0", "4"].map((digit, i) => (
						<motion.span
							key={i}
							className="select-none font-black leading-none text-primary"
							style={{ fontSize: "clamp(5rem, 18vw, 10rem)" }}
							{...DIGIT_FLOAT(i)}
						>
							{digit}
						</motion.span>
					))}
				</div>

				{/* Animated icon */}
				<motion.div
					className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
					animate={{ rotate: [-6, 6, -6] }}
					transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
				>
					<PackageX className="h-8 w-8 text-primary" />
				</motion.div>

				<motion.h2
					className="mb-3 text-2xl font-bold text-foreground"
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.15 }}
				>
					Page lost in delivery
				</motion.h2>

				<motion.p
					className="mb-8 max-w-xs text-sm leading-6 text-muted-foreground"
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.28 }}
				>
					This page doesn't exist or may have been moved. Let's get you back on track.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.42 }}
					whileHover={{ scale: 1.04 }}
					whileTap={{ scale: 0.97 }}
				>
					<Button asChild size="lg">
						<Link to="/">
							<Home className="mr-2 h-4 w-4" />
							Back to home
						</Link>
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
