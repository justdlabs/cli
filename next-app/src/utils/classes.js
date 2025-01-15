import { twMerge } from "tailwind-merge";
import { cnBase } from "tailwind-variants";
export const cn = (...inputs) => twMerge(cnBase(...inputs));
