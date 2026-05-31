"use client";

import { useEffect, useState } from "react";

interface Props {
  dateStr: string;
}

export default function ArticleDateTime({ dateStr }: Props) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const d = new Date(dateStr);
    const date = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);

    setFormatted(`${date}  ·  ${time}`);
  }, [dateStr]);

  if (!formatted) {
    return (
      <span className="inline-block w-44 h-4 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse" />
    );
  }

  return (
    <time
      dateTime={dateStr}
      className="text-sm text-gray-400 dark:text-gray-500"
    >
      {formatted}
    </time>
  );
}
