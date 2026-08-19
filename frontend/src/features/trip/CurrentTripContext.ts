import { createContext, useContext } from 'react';

interface CurrentTripContextValue {
  /** id последнего построенного рейса. null — рейса ещё нет. */
  tripId: string | null;
  setTripId: (tripId: string | null) => void;
}

const CurrentTripContext = createContext<CurrentTripContextValue>({
  tripId: null,
  setTripId: () => {},
});

export const CurrentTripProviderRaw = CurrentTripContext.Provider;

/**
 * id текущего рейса. Живёт над роутами: рейс строят на карте, а показывают
 * ещё в таблице заявок и в отчёте.
 */
export function useCurrentTripId(): CurrentTripContextValue {
  return useContext(CurrentTripContext);
}
