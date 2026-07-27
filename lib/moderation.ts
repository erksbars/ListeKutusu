type ReportSource = {
  postId: string;
  reason: string;
  reporter: { ownerName: string; slug: string };
};

export function groupReportsByPost<T extends ReportSource>(reports: T[]) {
  const grouped = new Map<
    string,
    T & {
      reportCount: number;
      reasons: string[];
      reporters: Array<{ ownerName: string; slug: string }>;
    }
  >();

  for (const report of reports) {
    const current = grouped.get(report.postId);
    if (!current) {
      grouped.set(report.postId, {
        ...report,
        reportCount: 1,
        reasons: [report.reason],
        reporters: [report.reporter],
      });
      continue;
    }
    current.reportCount += 1;
    if (!current.reasons.includes(report.reason)) current.reasons.push(report.reason);
    current.reporters.push(report.reporter);
  }

  return [...grouped.values()];
}
