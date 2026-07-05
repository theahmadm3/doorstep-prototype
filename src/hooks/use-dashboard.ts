import { useQuery } from "@tanstack/react-query";
import { getDashboard, type GetDashboardParams } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useUIStore } from "@/stores/useUIStore";

export function useSelectedCoords(): Pick<GetDashboardParams, "lat" | "lon"> {
	const { selectedAddress } = useUIStore();
	const lat = selectedAddress?.latitude
		? parseFloat(selectedAddress.latitude)
		: NaN;
	const lon = selectedAddress?.longitude
		? parseFloat(selectedAddress.longitude)
		: NaN;
	if (Number.isNaN(lat) || Number.isNaN(lon)) return {};
	return { lat, lon };
}

export function useDashboard({ enabled = true }: { enabled?: boolean } = {}) {
	const coords = useSelectedCoords();
	const query = useQuery({
		queryKey: QUERY_KEYS.dashboard(coords.lat, coords.lon),
		queryFn: () => getDashboard(coords),
		enabled,
	});
	return { ...query, coords };
}
