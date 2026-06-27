"use client";

import { Link, useLocation } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLink {
	href: string;
	label: string;
	icon: LucideIcon;
}

interface BottomNavigationProps {
	links: NavLink[];
}

export default function BottomNavigation({ links }: BottomNavigationProps) {
	const pathname = useLocation().pathname;
	const activeIndex = links.findIndex((link) => pathname.startsWith(link.href));

	return (
		<nav
			className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
			aria-label="Bottom navigation"
			style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
		>
			<div className="mx-4 mb-3">
				<div
					className={cn(
						"relative flex items-center justify-around h-[62px] px-1",
						"rounded-[28px]",
						// Liquid glass base
						"bg-white/25 dark:bg-black/25",
						"backdrop-blur-3xl",
						// Specular edge + inner highlight
						"border border-white/60 dark:border-white/20",
						"shadow-[0_8px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(255,255,255,0.15)]",
						"dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]",
					)}
				>
					{/* Active glass pill */}
					{activeIndex !== -1 && (
						<div
							className={cn(
								"absolute h-11 rounded-[20px] transition-all duration-300 ease-out",
								"bg-white/40 dark:bg-white/12",
								"border border-white/60 dark:border-white/20",
								"backdrop-blur-xl",
								"shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)]",
							)}
							style={{
								width: `calc(${100 / links.length}% - 10px)`,
								left: `calc(${activeIndex * (100 / links.length)}% + 5px)`,
							}}
						/>
					)}

					{links.map(({ href, label, icon: Icon }) => {
						const isActive = pathname.startsWith(href);
						return (
							<Link
								key={href}
								to={href}
								className="relative flex-1 flex flex-col items-center justify-center h-full gap-[3px] active:scale-90 transition-transform duration-150"
								aria-current={isActive ? "page" : undefined}
							>
								<Icon
									className={cn(
										"w-[22px] h-[22px] transition-colors duration-200",
										isActive
											? "text-primary"
											: "text-foreground/40 dark:text-white/40",
									)}
									aria-hidden="true"
								/>
								<span
									className={cn(
										"text-[10px] font-medium tracking-tight transition-colors duration-200",
										isActive
											? "text-primary"
											: "text-foreground/40 dark:text-white/40",
									)}
								>
									{label}
								</span>
							</Link>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
