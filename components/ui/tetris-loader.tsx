"use client";

export interface TetrisLoadingProps {
  size?: "sm" | "md" | "lg";
  speed?: "slow" | "normal" | "fast";
  showLoadingText?: boolean;
  loadingText?: string;
}

export default function TetrisLoading({}: TetrisLoadingProps) {
  return null;
}
