import { create } from "zustand";

export type LoadingStore = {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false, // Initialize with false by default
  setIsLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
}));

export default useLoadingStore;

// import useLoadingStore from './path_to_store';

// const MyComponent = () => {
//   const { isLoading, setIsLoading } = useLoadingStore();

//   // Example: Set loading state to true when starting an operation
//   const startOperation = () => {
//     setIsLoading(true);
//     // Some async operation
//     setTimeout(() => {
//       // End the operation, set loading to false
//       setIsLoading(false);
//     }, 2000);
//   };

//   return (
//     <div>
//       {isLoading ? <p>Loading...</p> : <p>Data Loaded!</p>}
//       <button onClick={startOperation}>Start Operation</button>
//     </div>
//   );
// };
