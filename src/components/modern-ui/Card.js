'use client';

import React from 'react';
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardContent as ShadcnCardContent,
  CardFooter as ShadcnCardFooter,
} from '../ui/card';

export function Card({ children, className = '', ...props }) {
  return (
    <ShadcnCard className={className} {...props}>
      {children}
    </ShadcnCard>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <ShadcnCardHeader className={className} {...props}>
      {children}
    </ShadcnCardHeader>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <ShadcnCardContent className={className} {...props}>
      {children}
    </ShadcnCardContent>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <ShadcnCardFooter className={className} {...props}>
      {children}
    </ShadcnCardFooter>
  );
}
