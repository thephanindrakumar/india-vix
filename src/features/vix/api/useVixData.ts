import { DATA_URL } from "@/app/config";
import { useEffect, useState } from "react";
import type { VixDataFile } from "../types";

type VixDataState = {
  data: VixDataFile | null;
  error: string | null;
  loading: boolean;
};

export function useVixData(): VixDataState {
  const [state, setState] = useState<VixDataState>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    fetch(DATA_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${DATA_URL}`);
        return response.json() as Promise<VixDataFile>;
      })
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setState({
          data: null,
          error: caught instanceof Error ? caught.message : "Unable to load VIX data",
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
