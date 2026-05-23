import { customAlphabet } from "nanoid";

const alpha = "23456789abcdefghjkmnpqrstuvwxyz";
export const newId = customAlphabet(alpha, 24);
export const newSlug = customAlphabet(alpha, 8);
