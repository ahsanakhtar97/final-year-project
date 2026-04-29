"use client";

import React from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryCta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * Reusable "no data yet" card. The point is to NEVER leave a user
 * staring at a blank page wondering what to do -- every empty state
 * earns its keep with a clear next action.
 */
export function EmptyState({
  icon,
  title,
  description,
  cta,
  secondaryCta,
}: EmptyStateProps) {
  return (
    <div className="gf-card p-10 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex items-center justify-center opacity-60">
          {icon}
        </div>
      )}
      <div className="font-semibold mb-1 text-lg">{title}</div>
      {description && (
        <p className="gf-muted text-sm max-w-md mx-auto">{description}</p>
      )}
      {(cta || secondaryCta) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {cta && (
            cta.href ? (
              <Link href={cta.href} className="gf-btn gf-btn-primary">
                {cta.label}
              </Link>
            ) : (
              <button onClick={cta.onClick} className="gf-btn gf-btn-primary">
                {cta.label}
              </button>
            )
          )}
          {secondaryCta && (
            secondaryCta.href ? (
              <Link href={secondaryCta.href} className="gf-btn gf-btn-ghost">
                {secondaryCta.label}
              </Link>
            ) : (
              <button onClick={secondaryCta.onClick} className="gf-btn gf-btn-ghost">
                {secondaryCta.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
